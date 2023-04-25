import type { GetServerSideProps, NextPage } from "next";
import styles from "../../styles/Admin.module.scss";

import { unstable_getServerSession } from "next-auth";
import { useS3Upload } from "next-s3-upload";
import Head from "next/head";
import { CheckCircle, Plus, Trash, XCircle } from "phosphor-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { SidebarAdmin } from "../../components/Admin/SidebarAdmin";
import { DataGridExchanges } from "../../components/GridComponents/DataGridExchanges";
import { Header } from "../../components/Header";
import { ModalAddExchange } from "../../components/Modals/Exchange/ModalAddExchange";
import { trpc } from "../../utils/trpc";
import { authOptions } from "../api/auth/[...nextauth]";

const AdminTaxPage: NextPage = () => {
  let { uploadToS3 } = useS3Upload();

  const [modalOpen, setModalOpen] = useState(false);

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

  const createExchangeMutation = trpc.useMutation("exchange.create", {
    onSuccess() {
      notify("Exchange criada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const {
    data: exchanges,
    isLoading,
    refetch,
  } = trpc.useQuery(["exchange.getExchanges"]);

  const deleteMutation = trpc.useMutation("exchange.delete", {
    onSuccess() {
      notify("Exchange deletada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const handleExchangeCreate = async (
    fee: number,
    tag: string,
    name: string,
    image: File,
    convert: boolean
  ) => {
    const { url } = await uploadToS3(image);

    console.log(url);

    createExchangeMutation.mutate({
      name,
      tag,
      fee,
      convert,
      image_url: url,
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

  return (
    <>
      <Head>
        <title>Exchanges</title>
        <meta name="description" content="Exchanges" />
      </Head>

      {modalOpen && (
        <ModalAddExchange
          onClose={handleClose}
          onSubmit={handleExchangeCreate}
        />
      )}
      <Header />
      <div className={`${styles.content} container`}>
        <SidebarAdmin />
        <main>
          <div className={styles.pageHeader}>
            <h1>Exchanges</h1>

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
                <Plus size={24} />
              </button>
            </div>
          </div>
          <div className={styles.container}>
            <DataGridExchanges
              data={exchanges || []}
              isLoading={isLoading}
              onSelect={handleSelection}
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
