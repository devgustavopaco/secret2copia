// components/GlassTableContainer.tsx
import { styled } from "@mui/material/styles";
import { TableContainer } from "@mui/material";

export const GlassTableContainer = styled(TableContainer)(({ theme }) => {
  const isDark = theme.palette.mode === "dark";

  return {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",

    // Glassmorphism EXTREMAMENTE transparente - praticamente invisível
    background: isDark
      ? "linear-gradient(135deg, rgba(15, 35, 65, 0.01), rgba(20, 45, 80, 0.008), rgba(15, 35, 65, 0.012))"
      : "linear-gradient(135deg, rgba(150, 90, 210, 0.008), rgba(240, 230, 255, 0.005), rgba(150, 90, 210, 0.006))",

    backdropFilter: "blur(18px) saturate(130%)",
    WebkitBackdropFilter: "blur(18px) saturate(130%)",

    border: isDark
      ? "1px solid rgba(64, 156, 255, 0.04)"
      : "1px solid rgba(150, 80, 220, 0.04)",

    // Sombras quase imperceptíveis
    boxShadow: [
      "0 8px 32px rgba(0, 0, 0, 0.04)",
      "0 4px 16px rgba(59, 130, 246, 0.015)",
      "inset 0 1px 0 rgba(255, 255, 255, 0.015)",
      "inset 0 -1px 0 rgba(0, 0, 0, 0.008)",
      "0 0 0 1px rgba(255, 255, 255, 0.01)",
    ].join(","),

    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

    // Hover state - extremamente suave
    "&:hover": {
      background: isDark
        ? "linear-gradient(135deg, rgba(15, 35, 65, 0.025), rgba(20, 45, 80, 0.018), rgba(15, 35, 65, 0.02))"
        : "linear-gradient(135deg, rgba(150, 90, 210, 0.018), rgba(240, 230, 255, 0.01), rgba(150, 90, 210, 0.015))",
      borderColor: isDark
        ? "rgba(64, 156, 255, 0.08)"
        : "rgba(150, 80, 220, 0.08)",
      boxShadow: [
        "0 12px 40px rgba(0, 0, 0, 0.06)",
        "0 6px 24px rgba(59, 130, 246, 0.025)",
        "inset 0 1px 0 rgba(255, 255, 255, 0.02)",
        "inset 0 -1px 0 rgba(0, 0, 0, 0.01)",
        "0 0 0 1px rgba(255, 255, 255, 0.015)",
      ].join(","),
      transform: "translateY(-2px)",
    },

    // Fallback para navegadores sem suporte a backdrop-filter
    "@supports not (backdrop-filter: blur(10px))": {
      background: isDark
        ? "rgba(15, 35, 65, 0.75)"
        : "rgba(255, 255, 255, 0.75)",
      border: isDark
        ? "1.5px solid rgba(64, 156, 255, 0.3)"
        : "1.5px solid rgba(150, 80, 220, 0.3)",
      boxShadow: [
        "0 12px 40px rgba(0, 0, 0, 0.15)",
        "inset 0 1px 0 rgba(255,255,255,0.2)",
        "inset 0 -1px 0 rgba(0,0,0,0.08)",
      ].join(","),
    },

    // Scrollbar estilizada
    "&::-webkit-scrollbar": {
      height: 10,
      width: 10,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "rgba(0, 0, 0, 0.15)",
      borderRadius: 10,
    },
    "&::-webkit-scrollbar-thumb": {
      background:
        "linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(124, 58, 237, 0.6))",
      borderRadius: 10,
      border: "2px solid rgba(255, 255, 255, 0.1)",
      "&:hover": {
        background:
          "linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(124, 58, 237, 0.8))",
      },
    },

    // Z-index para conteúdo
    "& > *": {
      position: "relative",
      zIndex: 2,
    },
  };
});
