import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useS3Upload } from "next-s3-upload";
import { CheckCircle, Plus, Trash, XCircle } from "phosphor-react";
import { ReactElement, useState } from "react";
import { toast } from "react-toastify";
import { DataGridExchanges } from "../../../components/GridComponents/DataGridExchanges";
import { ModalAddExchange } from "../../../components/Modals/Exchange/ModalAddExchange";
import DashboardLayout from "../../../layouts/DashboardLayout";
import styles from "../../../styles/user.module.scss";
import { trpc } from "../../../utils/trpc";
import { NextPageWithLayout } from "../../_app";
import { authOptions } from "../../api/auth/[...nextauth]";
const Exchanges: NextPageWithLayout = () => {
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

  const createExchangeMutation = trpc.useMutation(["exchange.create"], {
    onSuccess() {
      notify("Exchange criada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const deleteMutation = trpc.useMutation("exchange.delete", {
    onSuccess() {
      notify("Exchange deletada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const [searchText, setSearchText] = useState("");

  const {
    data: exchanges,
    isLoading,
    refetch,
  } = trpc.useQuery(["exchange.getExchanges", { search: searchText }]);

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
  const handleExchangeCreate = async (
    fee: number,
    tag: string,
    name: string,
    image: File,
    convert: boolean,
    bronze: boolean,
    silver: boolean,
    gold: boolean,
    platinum: boolean
  ) => {
    const { url } = await uploadToS3(image);

    if (silver) {
      bronze = true;
    }
    if (gold) {
      bronze = true;
      silver = true;
    }
    if (platinum) {
      bronze = true;
      silver = true;
      gold = true;
    }

    createExchangeMutation.mutate({
      name,
      tag,
      fee,
      convert,
      image_url: url,
      bronze,
      silver,
      gold,
      platinum,
    });
  };

  return (
    <>
      {modalOpen && (
        <ModalAddExchange
          onClose={handleClose}
          onSubmit={handleExchangeCreate}
        />
      )}
      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.topPart}>
            <h1>Exchanges</h1>
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
                <Plus size={24} />
              </button>
            </div>
          </div>
          <div className={styles.middlePart}>
            <DataGridExchanges
              data={exchanges || []}
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
Exchanges.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Exchanges;
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;

  const session = await getServerSession(req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  let isAdmin = session?.role === "admin" ? true : false;

  if (!isAdmin) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
