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
