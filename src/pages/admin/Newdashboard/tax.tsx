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

  async function fetchOKXTaxes() {
    setIsUpdatingOKX(true);
    try {
      const response = await axios.get("/api/withdraw/withdrawFeeOKX");

      const okxTaxes = response.data.data;
      console.log(okxTaxes);

      okxTaxes.forEach(async (coin: { ccy: any; minFee: any }) => {
        const { ccy, minFee } = coin;
        await axios.put("/api/withdraw/updateExchangeCoinTax", {
          exchangeId: "clar6ldzr0125b8u62skegl32",
          ticker: ccy,
          tax: parseFloat(minFee),
        });
      });

      notify("Taxas da OKX atualizadas com sucesso.", true);
    } catch (error) {
      console.error("Erro ao buscar taxas da OKX:", error);
      notify("Erro ao buscar taxas da OKX.", false);
    }
    setIsUpdatingOKX(false);
  }

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
    const coinsData = await fetchCoinInfo();
    if (coinsData && coinsData.length > 0) {
      const updatePromises = coinsData.map(
        ({ ticker, withdrawFee }: { ticker: string; withdrawFee: string }) =>
          updateExchangeCoinTax(ticker, withdrawFee).catch((error) => {
            console.error(`Erro ao atualizar ${ticker}:`, error);
            return null;
          })
      );
      const results = await Promise.all(updatePromises);

      const allSuccessful = results.every((result) => result !== null);

      if (allSuccessful) {
        notify("Taxas da binance atualizadas com sucesso!", true);
      } else {
        notify("Algumas taxas não puderam ser atualizadas.", false);
      }
    } else {
      console.log("Nenhuma moeda para atualizar.");
    }
    setIsUpdatingBinance(false);
  }

  async function fetchWithdrawFees() {
    setIsUpdatingMercadoBitcoin(true);
    try {
      const response = await axios.get(
        "/api/withdraw/withdrawFeeMercadoBitcoin"
      );
      const symbolsData = response.data;

      symbolsData.forEach(
        async (symbol: { baseCurrency: any; withdrawalFee: any }) => {
          const exchangeId = "clalg8ity029708mpx5h7ec65";
          const ticker = symbol.baseCurrency;

          const tax = parseFloat(symbol.withdrawalFee);

          try {
            await axios.put("/api/withdraw/updateExchangeCoinTax", {
              exchangeId,
              ticker,
              tax,
            });
          } catch (error) {
            console.error(
              `Erro ao atualizar a taxa da moeda ${ticker}:`,
              error
            );
          }
        }
      );

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
