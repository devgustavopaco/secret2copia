import { ReactElement, useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { NextPageWithLayout } from "../../_app";
import styles from "../../../styles/moeda-cadastrada.module.scss";
import React from "react";
import ArrowIcon from "../../../icons/ArrowIcon";
import { CheckCircle, CurrencyEth, Trash, XCircle } from "phosphor-react";
import { ModalAddCrypto } from "../../../components/Modals/ModalAddCrypto";
import XIcon from "../../../icons/XIcon";
import { useS3Upload } from "next-s3-upload";
import { trpc } from "../../../utils/trpc";
import { ModalAddExchange } from "../../../components/Modals/ModalAddExchange";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

type EditedTaxesType = {
  [key: string]: string;
};

interface Exchange {
  id: string;
  name: string;
  image_url: string | null;
}

interface ExchangeCoinTax {
  id: string;
  exchange: Exchange;
  tax: number;
}

interface CoinDetails {
  id: string;
  name: string;
  ticker: string;
  image_url: string | null;
  active: boolean;
  isFanToken: boolean;
  createdAt: Date;
  updatedAt: Date;
  ExchangeCoinTax: ExchangeCoinTax[];
}

const Moedacadastrada: NextPageWithLayout = () => {
  const [searchText, setSearchText] = useState("");
  const removeExchangeFromCoinMutation = trpc.useMutation(
    "coin.removeExchangeFromCoin"
  );
  const updateExchangeCoinTaxMutation = trpc.useMutation(
    "coin.updateExchangeCoinTax"
  );
  let { uploadToS3 } = useS3Upload();
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const { coinId: queryCoinId } = router.query;
  const coinId = Array.isArray(queryCoinId) ? queryCoinId[0] : queryCoinId;
  const [coinDetails, setCoinDetails] = useState<CoinDetails | null>(null);
  const [editedTaxes, setEditedTaxes] = useState<EditedTaxesType>({});

  const { data, error } = trpc.useQuery(
    ["coin.getById", { id: coinId as string }],
    {
      enabled: !!coinId,
    }
  );

  const createCryptoMutation = trpc.useMutation("coin.create", {
    onSuccess() {
      notify("Moeda criada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const {
    data: coins,
    isLoading,
    refetch,
  } = trpc.useQuery(["coin.getCoins", { search: searchText }]);

  const handleCryptoCreate = async (
    ticker: string,
    name: string,
    isFanToken: boolean,
    image?: File | null
  ) => {
    let imageUrl;
    if (image) {
      const { url } = await uploadToS3(image);
      imageUrl = url;
    }
    //@ts-ignore
    createCryptoMutation.mutate({
      active: true,
      name,
      ticker,
      isFanToken,
      imageUrl,
    });
  };

  useEffect(() => {
    if (data) {
      setCoinDetails(data);
    }
  }, [data]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Ocorreu um erro: {error.message}</div>;
  }

  const handleBack = () => {
    router.push("/admin/Newdashboard/crypto");
  };

  const handleRemoveExchange = (exchangeCoinTaxId: string) => {
    removeExchangeFromCoinMutation.mutate(
      { id: exchangeCoinTaxId },
      {
        onSuccess: () => {
          setCoinDetails((currentDetails) => {
            if (!currentDetails) return null;

            const updatedExchangeCoinTaxes =
              currentDetails.ExchangeCoinTax.filter(
                (ect) => ect.id !== exchangeCoinTaxId
              );

            return {
              ...currentDetails,
              ExchangeCoinTax: updatedExchangeCoinTaxes,
            };
          });
        },
        onError: (error) => {
          console.error("Failed to remove exchange from coin", error);
        },
      }
    );
  };

  const handleTaxChange = (exchangeId: string, newTaxValue: string) => {
    setEditedTaxes((prev) => ({ ...prev, [exchangeId]: newTaxValue }));
  };

  const saveTaxChange = (exchangeCoinTaxId: string, newTaxValue: string) => {
    const tax = parseFloat(newTaxValue);
    if (!isNaN(tax)) {
      updateExchangeCoinTaxMutation.mutate(
        {
          id: exchangeCoinTaxId,
          tax,
        },
        {
          onSuccess: () => {
            console.log("Taxa atualizada com sucesso!");

            toast.dark("Taxa salva com sucesso!", {
              icon: <CheckCircle size={32} color="#07bc0c" weight="fill" />,
            });
          },
          onError: (error) => {
            console.error("Erro ao atualizar a taxa:", error);

            toast.dark("Erro ao salvar a taxa.", {
              icon: <XCircle size={32} color="#ff3838" weight="fill" />,
            });
          },
        }
      );
    }
  };

  return (
    <>
      {modalOpen && (
        <ModalAddExchange
          setOpenModal={setModalOpen}
          coinId={coinId as string}
        />
      )}

      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <ArrowIcon onClick={handleBack} className={styles.arrow} />

            <h1>{coinDetails?.name}</h1>
            <div className={styles.cards}>
              <div className={styles.card}>
                <p>CÓDIGO</p>
                <span>{coinDetails?.ticker}</span>
              </div>
              <div className={styles.card}>
                <p>FAN TOKEN</p>
                <span>{coinDetails?.isFanToken ? "Sim" : "Não"}</span>
              </div>
              <div className={styles.card}>
                <p>ATIVO</p>
                <span>{coinDetails?.active ? "Sim" : "Não"}</span>
              </div>
            </div>
          </div>
          <div className={styles.middlePart}>
            <div className={styles.middleHeader}>
              <h1>Corretoras cadastradas</h1>
              <button
                className={styles.addCryptoButton}
                onClick={() => {
                  setModalOpen(true);
                }}
              >
                Adicionar <CurrencyEth size={24} />
              </button>
            </div>
            {coinDetails?.ExchangeCoinTax.map((exchangeCoinTax) => (
              <div key={exchangeCoinTax.id} className={styles.corretoraCard}>
                <img
                  src={exchangeCoinTax.exchange.image_url || "/corretora.png"}
                  alt={exchangeCoinTax.exchange.name}
                />
                <h3>{exchangeCoinTax.exchange.name}</h3>
                <div className={styles.tax}>
                  <p>TAXA:</p>
                  <input
                    type="number"
                    value={
                      editedTaxes[exchangeCoinTax.id] ?? exchangeCoinTax.tax
                    }
                    onChange={(e) =>
                      handleTaxChange(exchangeCoinTax.id, e.target.value)
                    }
                    className={styles.taxInput}
                  />
                  <button
                    onClick={() =>
                      saveTaxChange(
                        exchangeCoinTax.id,
                        editedTaxes[exchangeCoinTax.id] ??
                          exchangeCoinTax.tax.toString()
                      )
                    }
                    className={styles.saveButton}
                  >
                    Salvar
                  </button>
                </div>
                <XIcon
                  onClick={() => handleRemoveExchange(exchangeCoinTax.id)}
                  className={styles.arrow}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};
Moedacadastrada.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Moedacadastrada;
function notify(arg0: string, arg1: boolean) {
  throw new Error("Function not implemented.");
}
