import { ReactElement, useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { NextPageWithLayout } from "../../_app";
import { CheckCircle, CurrencyEth, Trash, XCircle } from "phosphor-react";
import styles from "../../../styles/user.module.scss";
import React from "react";
import { trpc } from "../../../utils/trpc";
import { DataGridCryptos } from "../../../components/GridComponents/DataGridCryptos";
import { ModalAddCrypto } from "../../../components/Modals/ModalAddCrypto";
import { useS3Upload } from "next-s3-upload";
import { toast } from "react-toastify";

const Crypto: NextPageWithLayout = () => {
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

  let { uploadToS3 } = useS3Upload();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const {
    data: coins,
    isLoading,
    refetch,
  } = trpc.useQuery(["coin.getCoins", { search: searchText }]);

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

  const deleteMutation = trpc.useMutation("coin.delete", {
    onSuccess() {
      notify("Moeda deletada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const createCryptoMutation = trpc.useMutation("coin.create", {
    onSuccess() {
      notify("Moeda criada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const handleCryptoCreate = async (
    ticker: string,
    name: string,
    isFanToken: boolean,
    exchangeId: string,
    tax: number,
    confirmations: number,
    imageUrl?: string // Changed from 'image'
  ) => {
    // Use imageUrl directly
    createCryptoMutation.mutate({
      active: true,
      name,
      ticker,
      isFanToken,
      imageUrl, // Use the imageUrl directly
      exchangeId,
      tax,
      confirmations,
    });
  };

  return (
    <>
      {modalOpen && (
        <ModalAddCrypto
          setOpenModal={setModalOpen}
          onSubmit={handleCryptoCreate}
        />
      )}
      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.topPart}>
            <h1>Cryptos</h1>
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
            <DataGridCryptos
              data={coins || []}
              isLoading={isLoading}
              onSelect={handleSelection}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </main>
    </>
  );
};
Crypto.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Crypto;
function notify(arg0: string, arg1: boolean) {
  throw new Error("Function not implemented.");
}
