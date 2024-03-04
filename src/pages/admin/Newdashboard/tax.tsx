import { ReactElement, useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { NextPageWithLayout } from "../../_app";
import styles from "../../../styles/user.module.scss";
import React from "react";
import { DataGridTaxes } from "../../../components/GridComponents/DataGridTaxes";
import { trpc } from "../../../utils/trpc";
import { CheckCircle, CurrencyEth, Trash, XCircle } from "phosphor-react";
import { ModalAddTax } from "../../../components/Modals/Taxes/ModalAddTax";
import { toast } from "react-toastify";
import axios from "axios";
import { ExchangeCoinTax } from "@prisma/client";
import { BeatLoader, PacmanLoader } from "react-spinners";
import { Prisma } from "@prisma/client";

interface WithdrawFeeResponseItem {
  currency: string;
  fee: string;
}
const Tax: NextPageWithLayout = () => {
  const notify = (text: string, success: boolean) => {
    if (success) {
      toast.dark(text, {
        icon: <CheckCircle size={32} color="#07bc0c" weight="fill" />,
      });
    } else {
      toast.dark(text, {
        icon: <XCircle size={32} color="#ff3838" weight="fill" />,
      });
    }
  };
  const [isUpdatingBinance, setIsUpdatingBinance] = useState(false);
  const [isUpdatingOKX, setIsUpdatingOKX] = useState(false);
  const [isUpdatingMercadoBitcoin, setIsUpdatingMercadoBitcoin] =
    useState(false);
  const [isUpdatingKuCoin, setIsUpdatingKuCoin] = useState(false);

  const deleteMutation = trpc.useMutation("tax.delete", {
    onSuccess() {
      notify("Taxa deletada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const {
    data: taxes,
    isLoading,
    refetch,
  } = trpc.useQuery(["tax.getTaxes", { search: searchText }]);

  const [withdrawFees, setWithdrawFees] = useState<WithdrawFeeResponseItem[]>(
    []
  );

  const handleSelection = (ids: string[]) => {
    setSelectedIds(ids);
  };
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleDeletion = () => {
    deleteMutation.mutate({
      ids: selectedIds,
    });
  };

  const handleSearch = (newSearchText: string) => {
    setSearchText(newSearchText);
  };
  const handleClose = () => {
    setModalOpen(false);
  };

  const handleTaxCreate = (
    exchangeId: string,
    coinId: string,
    tax: number,
    confirmations: number
  ) => {
    createTaxMutation.mutate({
      exchangeId,
      coinId,
      tax,
      confirmations,
    });
  };

  const createTaxMutation = trpc.useMutation("tax.create", {
    onSuccess() {
      notify("Taxa criada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  async function fetchCoinInfo() {
    try {
      const response = await axios.get("/api/withdraw/withdrawFeeBinance");
      const structuredData = response.data
        .map((coin: { networkList: any[]; coin: string }) => {
          const ethNetwork = coin.networkList.find(
            (network: { network: string }) => network.network === "ETH"
          );

          const defaultNetwork = coin.networkList.find(
            (network: { isDefault: any }) => network.isDefault
          );

          const selectedNetwork = ethNetwork || defaultNetwork;
          return {
            ticker: coin.coin,
            withdrawFee: selectedNetwork ? selectedNetwork.withdrawFee : null,
          };
        })
        .filter((coin: { withdrawFee: null }) => coin.withdrawFee !== null);

      console.log(structuredData);
      return structuredData;
    } catch (error) {
      console.error("Erro ao buscar informações da moeda:", error);
      return null;
    }
  }

  async function updateAllExchangeCoinTaxes() {
    setIsUpdatingBinance(true);
    try {
      // Obter tickers registrados para a Binance
      const registeredTickers: string[] = await fetchRegisteredBinanceCoins();

      // Obter dados da API da Binance
      const coinsData = await fetchCoinInfo();

      // Filtrar moedas por tickers registrados
      const filteredCoinsData = coinsData.filter((coin: { ticker: string }) =>
        registeredTickers.includes(coin.ticker)
      );

      if (filteredCoinsData.length > 0) {
        // Mapear moedas filtradas para promessas de atualização
        const updatePromises = filteredCoinsData.map(
          async ({
            ticker,
            withdrawFee,
          }: {
            ticker: string;
            withdrawFee: string;
          }) => {
            try {
              await updateExchangeCoinTax(ticker, withdrawFee);
              return ticker;
            } catch (error) {
              console.error(`Erro ao atualizar ${ticker}:`, error);
              return null;
            }
          }
        );

        const results = await Promise.all(updatePromises);

        const allSuccessful = results.every((result) => result !== null);

        if (allSuccessful) {
          notify("Taxas da Binance atualizadas com sucesso!", true);
        } else {
          notify("Algumas taxas não puderam ser atualizadas.", false);
        }
      } else {
        console.log("Nenhuma moeda registrada para atualizar.");
      }
    } catch (error) {
      console.error("Erro ao atualizar taxas da Binance:", error);
      notify("Erro ao buscar/atualizar taxas da Binance.", false);
    }
    setIsUpdatingBinance(false);
  }
  async function fetchWithdrawFees() {
    setIsUpdatingMercadoBitcoin(true);
    try {
      const registeredTickers = await fetchRegisteredMercadoBitcoinCoins();

      const response = await axios.get(
        "/api/withdraw/withdrawFeeMercadoBitcoin"
      );
      const symbolsData = response.data;

      const filteredSymbolsData = symbolsData.filter(
        (symbol: { baseCurrency: any }) =>
          registeredTickers.includes(symbol.baseCurrency)
      );

      for (const symbol of filteredSymbolsData) {
        const { baseCurrency, withdrawalFee } = symbol;
        const exchangeId = "clalg8ity029708mpx5h7ec65";
        const tax = parseFloat(withdrawalFee);

        try {
          await axios.put("/api/withdraw/updateExchangeCoinTax", {
            exchangeId,
            ticker: baseCurrency,
            tax,
          });
        } catch (error) {
          console.error(
            `Erro ao atualizar a taxa da moeda ${baseCurrency}:`,
            error
          );
        }
      }

      notify("Taxas do mercado Bitcoin atualizadas com sucesso.", true);
    } catch (error) {
      console.error(
        "Erro ao buscar taxas de retirada do Mercado Bitcoin:",
        error
      );
      notify("Erro ao buscar taxas de retirada.", false);
    }
    setIsUpdatingMercadoBitcoin(false);
  }

  async function updateExchangeCoinTax(ticker: string, withdrawFee: string) {
    const exchangeId = "clbeiai3k003409l7m4gz18al";
    const tax = parseFloat(withdrawFee);
    const response = await axios.put("/api/withdraw/updateExchangeCoinTax", {
      exchangeId,
      ticker,
      tax,
    });

    if (response.status === 200) {
      console.log(
        `Taxa atualizada com sucesso para a moeda ${ticker}:`,
        response.data
      );

      return true;
    } else {
      throw new Error(`Erro ao atualizar taxa para a moeda ${ticker}.`);
    }
  }

  const fetchRegisteredMercadoBitcoinCoins = async () => {
    try {
      const response = await axios.get("/api/withdraw/getExchangeCoinTax", {
        params: { exchangeId: "clalg8ity029708mpx5h7ec65" },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar moedas registradas:", error);
      return [];
    }
  };
  const fetchRegisteredBinanceCoins = async () => {
    try {
      const response = await axios.get("/api/withdraw/getExchangeCoinTax", {
        params: { exchangeId: "clbeiai3k003409l7m4gz18al" },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar moedas registradas:", error);
      return [];
    }
  };

  const fetchRegisteredKuCoinCoins = async () => {
    try {
      const response = await axios.get("/api/withdraw/getExchangeCoinTax", {
        params: { exchangeId: "clar7tmuh003408l0zh17nu7t" },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar moedas registradas:", error);
      return [];
    }
  };

  const handleFetchRegisteredCoinsClick = async () => {
    await fetchRegisteredKuCoinCoins();
  };

  const fetchWithdrawFeesKuCoin = async () => {
    setIsUpdatingKuCoin(true);
    try {
      const registeredTickers = await fetchRegisteredKuCoinCoins();

      const response = await axios.get("/api/withdraw/withdrawFeeKukoin");
      const kuCoinTaxes = response.data.data;

      const filteredKuCoinTaxes = kuCoinTaxes.filter((coin: any) =>
        registeredTickers.includes(coin.name)
      );

      for (const coin of filteredKuCoinTaxes) {
        const { name, withdrawalMinFee } = coin;
        await axios.put("/api/withdraw/updateExchangeCoinTax", {
          exchangeId: "clar7tmuh003408l0zh17nu7t",
          ticker: name,
          tax: parseFloat(withdrawalMinFee),
        });
      }

      notify("Taxas da KuCoin atualizadas com sucesso.", true);
    } catch (error) {
      console.error("Erro ao buscar/atualizar taxas da KuCoin:", error);
      notify("Erro ao buscar taxas da KuCoin.", false);
    }
    setIsUpdatingKuCoin(false);
  };

  async function fetchOKXTaxes() {
    setIsUpdatingOKX(true);
    try {
      const registeredTickers: string[] = await fetchRegisteredOKXCoins();

      const response = await axios.get("/api/withdraw/withdrawFeeOKX");
      const okxTaxes = response.data.data;

      const filteredOKXTaxes = okxTaxes.filter((coin: any) =>
        registeredTickers.includes(coin.ccy)
      );

      for (const coin of filteredOKXTaxes) {
        const { ccy, minFee } = coin;
        await axios.put("/api/withdraw/updateExchangeCoinTax", {
          exchangeId: "clar6ldzr0125b8u62skegl32",
          ticker: ccy,
          tax: parseFloat(minFee),
        });
      }

      notify("Taxas da OKX atualizadas com sucesso.", true);
    } catch (error) {
      console.error("Erro ao buscar/atualizar taxas da OKX:", error);
      notify("Erro ao buscar taxas da OKX.", false);
    }
    setIsUpdatingOKX(false);
  }

  const fetchRegisteredOKXCoins = async () => {
    try {
      const response = await axios.get("/api/withdraw/getExchangeCoinTax", {
        params: { exchangeId: "clar6ldzr0125b8u62skegl32" },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar moedas registradas:", error);
      return [];
    }
  };
  return (
    <>
      {modalOpen && (
        <ModalAddTax onClose={handleClose} onSubmit={handleTaxCreate} />
      )}
      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.topPart}>
            <h1>Taxas</h1>

            <div className={styles.buttons}>
              <button
                type="button"
                className={styles.addCryptoButton}
                onClick={handleDeletion}
                datatype="remove"
              >
                Remover
                <Trash size={24} />
              </button>
              <button
                type="button"
                className={styles.addCryptoButton}
                onClick={() => {
                  setModalOpen(true);
                }}
              >
                Adicionar
                <CurrencyEth size={24} />
              </button>
            </div>
          </div>
          <div className={styles.middlePart}>
            <DataGridTaxes
              data={taxes || []}
              isLoading={isLoading}
              onSelect={handleSelection}
              onSearch={handleSearch}
            />
          </div>
          <div className={styles.refacButtons}>
            <button
              onClick={updateAllExchangeCoinTaxes}
              className={styles.addCryptoButton}
              disabled={isUpdatingBinance}
            >
              {isUpdatingBinance ? (
                <>
                  <span>Atualizando taxas</span>
                  <BeatLoader size={8} color={"#FFFFFF"} margin={2} />
                </>
              ) : (
                "Atualizar Taxas da Binance"
              )}
            </button>

            <button
              onClick={fetchOKXTaxes}
              className={styles.addCryptoButton}
              disabled={isUpdatingOKX}
            >
              {isUpdatingOKX ? (
                <>
                  <span>Atualizando taxas</span>
                  <BeatLoader size={8} color={"#FFFFFF"} margin={2} />
                </>
              ) : (
                "Atualizar Taxas da OKX"
              )}
            </button>

            <button
              onClick={fetchWithdrawFees}
              className={styles.addCryptoButton}
              disabled={isUpdatingMercadoBitcoin}
            >
              {isUpdatingMercadoBitcoin ? (
                <>
                  <span>Atualizando taxas</span>
                  <BeatLoader size={8} color={"#FFFFFF"} margin={2} />
                </>
              ) : (
                "Atualizar taxas do Mercado Bitcoin"
              )}
            </button>
            <button
              onClick={fetchWithdrawFeesKuCoin}
              className={styles.addCryptoButton}
              disabled={isUpdatingKuCoin}
            >
              {isUpdatingKuCoin ? (
                <>
                  <span>Atualizando taxas</span>
                  <BeatLoader size={8} color={"#FFFFFF"} margin={2} />
                </>
              ) : (
                "Atualizar taxas da KuCoin"
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
};
Tax.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Tax;
function notify(arg0: string, arg1: boolean) {
  throw new Error("Function not implemented.");
}
