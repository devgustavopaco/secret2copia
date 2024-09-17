import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useS3Upload } from "next-s3-upload";
import { CheckCircle, Plus, Trash, XCircle } from "phosphor-react";
import { ReactElement, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DataGridUsers } from "../../../components/GridComponents/DataGridUsers";
import { ModalAddUser } from "../../../components/Modals/ModalAddUser";
import { ModalDeleteUser } from "../../../components/Modals/ModalDeleteUser";
import DashboardLayout from "../../../layouts/DashboardLayout";
import styles from "../../../styles/user.module.scss";
import { trpc } from "../../../utils/trpc";
import { NextPageWithLayout } from "../../_app";
import { authOptions } from "../../api/auth/[...nextauth]";

const Users: NextPageWithLayout = () => {
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
  const [idsFromGrid, setIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [itemDeleted, setItemDeleted] = useState(false);
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [modalOpenDelete, setModalOpenDelete] = useState(false);
  const {
    data: users,
    isLoading,
    refetch,
  } = trpc.useQuery(["user.getAllUsers", { search: searchText }]);

  useEffect(() => {
    if (idsFromGrid.length !== 0) {
      deleteUserMutation.mutate({
        ids: idsFromGrid,
      });
    }
  }, [itemDeleted]);

  const deleteUserMutation = trpc.useMutation("user.delete", {
    onSuccess() {
      notify("Usuário deletado com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const handleSearch = (newSearchText: string) => {
    setSearchText(newSearchText);
  };

  const handleUserCreate = async (
    name: string,
    email: string,
    phone: string,
    pricePaid: number,
    password: string,
    dolarValue: number,
    bronze: boolean,
    silver: boolean,
    gold: boolean,
    platinum: boolean,
    image?: File | null
  ) => {
    let imageUrl;
    let ip = "";
    if (image) {
      const { url } = await uploadToS3(image);
      imageUrl = url;
    }

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
    createUserMutation.mutate({
      name,
      email,
      pricePaid,
      phone,
      password,
      dolarValue,
      imageUrl,
      bronze,
      silver,
      gold,
      platinum,
      ip,
    });

    try {
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (response.status !== 200) {
        notify("Não foi possível realizar a operação!", false);
      }
    } catch (error) {
      notify("Ocorreu um erro ao tentar alterar a senha", false);
    }
  };

  const createUserMutation = trpc.useMutation("user.create", {
    onSuccess() {
      notify("Usuário criado com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });
  const handleUserDelete = (ids: string[]) => {
    setIds(ids);
  };

  return (
    <>
      {modalOpenAdd && (
        <ModalAddUser
          setOpenModal={setModalOpenAdd}
          onSubmit={handleUserCreate}
        />
      )}
      {modalOpenDelete && (
        <ModalDeleteUser
          setOpenModal={setModalOpenDelete}
          deleted={setItemDeleted}
        />
      )}
      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.topPart}>
            <h1>Usuários</h1>
            <div className={styles.buttons}>
              <button
                type="button"
                className={styles.addCryptoButton}
                onClick={() => {
                  setModalOpenDelete(true);
                }}
              >
                Remover
                <Trash size={24} />
              </button>
              <button
                type="button"
                className={styles.addCryptoButton}
                onClick={() => {
                  setModalOpenAdd(true);
                }}
              >
                Adicionar
                <Plus size={24} />
              </button>
            </div>
          </div>
          <div className={styles.middlePart}>
            <DataGridUsers
              onDelete={handleUserDelete}
              data={users || []}
              isLoading={isLoading}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </main>
    </>
  );
};
Users.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Users;
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
