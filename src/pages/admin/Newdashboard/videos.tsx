import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { CheckCircle, Plus, Trash, XCircle } from "phosphor-react";
import { ReactElement, useState } from "react";
import { toast } from "react-toastify";
import { DataGridVideos } from "../../../components/GridComponents/DataGridVideos";
import { ModalAddVideo } from "../../../components/Modals/ModalAddVideo";
import DashboardLayout from "../../../layouts/DashboardLayout";
import styles from "../../../styles/user.module.scss";
import { trpc } from "../../../utils/trpc";
import { NextPageWithLayout } from "../../_app";
import { authOptions } from "../../api/auth/[...nextauth]";
const Videos: NextPageWithLayout = () => {
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
  const deleteMutation = trpc.useMutation("videos.delete", {
    onSuccess() {
      notify("Video deletada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data: videos,
    isLoading,
    refetch,
  } = trpc.useQuery(["videos.getVideos"]);

  const handleSelection = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleDeletion = () => {
    deleteMutation.mutate({
      ids: selectedIds,
    });
  };

  const createVideoMutation = trpc.useMutation("videos.create", {
    onSuccess() {
      notify("Aula criada com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });
  const handleVideoCreate = async (
    title: string,
    description: string,
    additionalMaterial: string | undefined,
    idYoutube: string,
    createdAt: Date
  ) => {
    createVideoMutation.mutate({
      title,
      description,
      additionalMaterial,
      idYoutube,
      createdAt,
    });
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  return (
    <>
      {modalOpen && (
        <ModalAddVideo
          setOpenModal={handleClose}
          onSubmit={handleVideoCreate}
        />
      )}
      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.topPart}>
            <h1>Videos</h1>
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
            <DataGridVideos
              data={videos || []}
              isLoading={isLoading}
              onDelete={handleSelection}
            />
          </div>
        </div>
      </main>
    </>
  );
};
Videos.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Videos;

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
