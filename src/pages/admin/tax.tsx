import type { GetServerSideProps, NextPage } from "next";

import { unstable_getServerSession } from "next-auth";
import Head from "next/head";
import { CheckCircle, CurrencyEth, Trash, XCircle } from "phosphor-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { SidebarAdmin } from "../../components/Admin/SidebarAdmin";
import { DataGridTaxes } from "../../components/GridComponents/DataGridTaxes";
import { Header } from "../../components/Header";
import { ModalAddTax } from "../../components/Modals/Taxes/ModalAddTax";
import styles from "../../styles/Admin.module.scss";
import { trpc } from "../../utils/trpc";
import { authOptions } from "../api/auth/[...nextauth]";

const AdminTaxPage: NextPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

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

  const createTaxMutation = trpc.useMutation("tax.create", {
    onSuccess() {
      notify("Taxa criada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const {
    data: taxes,
    isLoading,
    refetch,
  } = trpc.useQuery(["tax.getTaxes", { search: searchText }]);

  const deleteMutation = trpc.useMutation("tax.delete", {
    onSuccess() {
      notify("Taxa deletada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

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

  const handleClose = () => {
    setModalOpen(false);
  };

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

  return (
    <>
      <Head>
        <title>Taxas</title>
        <meta name="description" content="Taxas" />
      </Head>

      {modalOpen && (
        <ModalAddTax onClose={handleClose} onSubmit={handleTaxCreate} />
      )}
      <Header />
      <div className={`${styles.content} container`}>
        <SidebarAdmin />
        <main>
          <div className={styles.pageHeader}>
            <h1>Taxas</h1>

            <div className={styles.buttonCryptoList}>
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
          <div className={styles.container}>
            <DataGridTaxes
              data={taxes || []}
              isLoading={isLoading}
              onSelect={handleSelection}
              onSearch={handleSearch}
            />
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminTaxPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session || session?.role !== "admin") {
    return {
      redirect: {
        destination: "/",
        permanent: true,
      },
    };
  }

  return {
    props: {},
  };
};
