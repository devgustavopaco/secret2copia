import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { CheckCircle, PhoneCall, XCircle } from "phosphor-react";
import { ReactElement, useState } from "react";
import { toast } from "react-toastify";
import { Chart } from "../../../components/Admin/Chart";
import { ModalEditSuportContent } from "../../../components/Modals/ModalEditSuportContent";
import DashboardLayout from "../../../layouts/DashboardLayout";
import styles from "../../../styles/Dashboard.module.scss";
import { NextPageWithLayout } from "../../_app";
import { authOptions } from "../../api/auth/[...nextauth]";

const Dashboard: NextPageWithLayout = () => {
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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditSupportPhone = () => {
    setIsModalOpen(true);
  };

  const editSupportPhone = async (whatsAppUrl: string) => {
    try {
      const response = await fetch("/api/editSuportNumber", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsAppUrl,
        }),
      });

      if (response.status !== 200) {
        notify("Não foi possível realizar a operação!", false);
      } else {
        notify("Número de suporte alterado com sucesso!", true);
      }
    } catch (error) {
      notify("Ocorreu um erro ao tentar alterar a senha", false);
    }
  };

  return (
    <>
      {isModalOpen && (
        <ModalEditSuportContent
          setOpenModal={setIsModalOpen}
          onSubmit={editSupportPhone}
        />
      )}
      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.middlePart}>
            <div className={styles.middletitle}>
              <h1>Visão Geral</h1>
              <button
                type="button"
                onClick={handleEditSupportPhone}
                className={styles.addCryptoButton}
                datatype="editar telefone"
              >
                Editar telefone de contato
                <PhoneCall size={24} />
              </button>
            </div>
            <Chart />
          </div>
        </div>
      </main>
    </>
  );
};

Dashboard.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Dashboard;

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
