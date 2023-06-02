import type { GetServerSideProps, NextPage } from "next";
import { CheckCircle, Plus, Trash, XCircle } from "phosphor-react";
import { DataGridUsers } from "../../components/GridComponents/DataGridUsers";

import { unstable_getServerSession } from "next-auth";
import Head from "next/head";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SidebarAdmin } from "../../components/Admin/SidebarAdmin";
import { Header } from "../../components/Header";
import { ModalAddUser } from "../../components/Modals/ModalAddUser";
import { ModalDeleteUser } from "../../components/Modals/ModalDeleteUser";
import styles from "../../styles/Admin.module.scss";
import { trpc } from "../../utils/trpc";
import { authOptions } from "../api/auth/[...nextauth]";

const AdminUsers: NextPage = () => {
  const [modalOpenDelete, setModalOpenDelete] = useState(false);
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [itemDeleted, setItemDeleted] = useState(false);
  const [idsFromGrid, setIds] = useState<string[]>([]);
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

  const handleSearch = (newSearchText: string) => {
    setSearchText(newSearchText);
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

  const deleteUserMutation = trpc.useMutation("user.delete", {
    onSuccess() {
      notify("Usuário deletado com sucesso!", true);
      refetch();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });
  // Create
  const handleUserCreate = (
    name: string,
    email: string,
    phone: string,
    pricePaid: number,
    password: string
  ) => {
    createUserMutation.mutate({
      name,
      email,
      pricePaid,
      phone,
      password,
    });
  };

  const handleUserDelete = (ids: string[]) => {
    setIds(ids);
  };

  return (
    <>
      <Head>
        <title>Usuários</title>
        <meta name="description" content="Usuários" />
      </Head>

      {modalOpenDelete && (
        <ModalDeleteUser
          setOpenModal={setModalOpenDelete}
          deleted={setItemDeleted}
        />
      )}
      {modalOpenAdd && (
        <ModalAddUser
          setOpenModal={setModalOpenAdd}
          onSubmit={handleUserCreate}
        />
      )}
      <Header />
      <div className={`${styles.content} container`}>
        <SidebarAdmin />
        <main>
          <div className={styles.pageHeader}>
            <h1>Usuários</h1>

            <div className={styles.buttonCryptoList}>
              <button
                type="button"
                className={styles.addCryptoButton}
                onClick={() => {
                  setModalOpenDelete(true);
                }}
                datatype="remove"
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
          <div className={styles.container}>
            <DataGridUsers
              onDelete={handleUserDelete}
              data={users || []}
              isLoading={isLoading}
              onSearch={handleSearch}
            />
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminUsers;

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
