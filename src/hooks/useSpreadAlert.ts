import { useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import type { ArbitrageOpportunity } from "../server/router/orderbook";

export type SpreadAlertConfig = {
  spreadValue: number;
  alertDuration: number; // em segundos
  repeatAlerts: boolean;
  alertInterval: number; // em segundos
  isActive: boolean;
};

type AlertedOpportunity = {
  key: string;
  lastAlertTime: number;
  alertCount: number;
};

export function useSpreadAlert(
  opportunities: ArbitrageOpportunity[] | undefined,
  config: SpreadAlertConfig | null,
  isExitMode: boolean
) {
  const alertedRef = useRef<Map<string, AlertedOpportunity>>(new Map());
  const alertStartTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Limpar intervalos quando o alerta é desativado ou config muda
  useEffect(() => {
    if (!config || !config.isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      alertStartTimeRef.current = null;
      return;
    }

    // Validar configuração: se alertas repetidos estão ativos, intervalo deve ser >= duração
    if (config.repeatAlerts && config.alertDuration > config.alertInterval) {
      console.warn(
        "Configuração inválida: duração do alerta maior que intervalo entre alertas. Ajustando..."
      );
      // Ajustar automaticamente: usar intervalo = duração
      config.alertInterval = config.alertDuration;
    }

    // Limitar duração máxima (300 segundos = 5 minutos)
    const maxDuration = Math.min(config.alertDuration, 300);
    const maxInterval = Math.min(config.alertInterval, 300);

    // Iniciar o timer de duração
    alertStartTimeRef.current = Date.now();

    // Limpar quando a duração expirar
    const durationTimeout = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      alertStartTimeRef.current = null;
      alertedRef.current.clear();
    }, maxDuration * 1000);

    return () => {
      clearTimeout(durationTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [config]);

  // Função para tocar som de notificação
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar o som (frequência, tipo de onda, volume)
      oscillator.frequency.value = 800; // Frequência em Hz (tom médio-alto)
      oscillator.type = "sine"; // Tipo de onda (sine = suave)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Volume
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      ); // Fade out

      // Tocar o som
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3); // Duração de 300ms
    } catch (error) {
      // Se falhar, apenas ignora (pode ser bloqueado pelo navegador)
      console.warn("Não foi possível tocar o som de notificação:", error);
    }
  }, []);

  // Função para mostrar o alerta
  const showAlert = useCallback(
    (opp: ArbitrageOpportunity, spread: number, isExitMode: boolean) => {
      // Tocar som de notificação
      playNotificationSound();

      const ticker = opp.ticker?.replace(/USDT$/i, "") || opp.ticker || "—";
      const spotExchange = opp.lowestAsk?.exchange || "—";
      const futuresExchange = opp.highestBid?.exchange || "—";
      const spreadType = isExitMode ? "Fechamento" : "Entrada";

      const message = `🚨 Alerta de Spread ${spreadType}!\n${ticker}: ${spread.toFixed(
        2
      )}%\n${spotExchange} → ${futuresExchange}`;

      toast.dark(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: "linear-gradient(90deg, #8c5fff, #6d41ff)",
          color: "#fff",
          borderRadius: "12px",
          padding: "16px",
          fontSize: "14px",
          fontWeight: 500,
          whiteSpace: "pre-line",
        },
      });
    },
    [playNotificationSound]
  );

  // Função para verificar e notificar oportunidades
  const checkAndNotify = useCallback(() => {
    if (!config || !config.isActive || !opportunities) return;

    const now = Date.now();

    // Verificar se ainda está dentro da duração do alerta (limitado a 300s)
    if (alertStartTimeRef.current) {
      const maxDuration = Math.min(config.alertDuration, 300);
      const elapsed = (now - alertStartTimeRef.current) / 1000;
      if (elapsed > maxDuration) {
        return;
      }
    }

    const mutedKeys = (() => {
      if (typeof window === "undefined") return new Set<string>();
      try {
        const raw = localStorage.getItem("mutedOpportunities");
        const parsed = raw ? JSON.parse(raw) : [];
        return new Set<string>(Array.isArray(parsed) ? parsed : []);
      } catch {
        return new Set<string>();
      }
    })();

    opportunities.forEach((opp) => {
      if (!opp) return;

      // Usa spread de entrada ou fechamento baseado no modo
      const spread = isExitMode ? opp.spreadS ?? 0 : opp.spread ?? 0;

      // Verifica se o spread atinge o valor configurado
      if (spread >= config.spreadValue) {
        const key = `${opp.ticker}-${opp.lowestAsk?.exchange}-${opp.highestBid?.exchange}`;
        if (mutedKeys.has(key)) return;
        const alerted = alertedRef.current.get(key);

        // Se não foi alertado ainda, ou se alertas repetidos estão ativos
        if (!alerted) {
          // Primeira notificação
          showAlert(opp, spread, isExitMode);
          alertedRef.current.set(key, {
            key,
            lastAlertTime: now,
            alertCount: 1,
          });
        } else if (config.repeatAlerts) {
          // Verificar se passou o intervalo para alertas repetidos
          const timeSinceLastAlert = (now - alerted.lastAlertTime) / 1000;
          if (timeSinceLastAlert >= config.alertInterval) {
            showAlert(opp, spread, isExitMode);
            alertedRef.current.set(key, {
              key,
              lastAlertTime: now,
              alertCount: alerted.alertCount + 1,
            });
          }
        }
      }
    });
  }, [config, opportunities, isExitMode, showAlert]);

  // Verificar oportunidades periodicamente
  useEffect(() => {
    if (!config || !config.isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Verificar imediatamente
    checkAndNotify();

    // Configurar intervalo de verificação (a cada 1 segundo)
    intervalRef.current = setInterval(() => {
      checkAndNotify();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkAndNotify, config]);

  // Limpar alertas quando o alerta é desativado
  useEffect(() => {
    if (!config || !config.isActive) {
      alertedRef.current.clear();
    }
  }, [config]);
}
