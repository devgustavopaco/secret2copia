import type { GetServerSideProps, NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { CheckCircle, XCircle } from "phosphor-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { toast } from "react-toastify";

import { getServerSession } from "next-auth";
import { Header } from "../components/Header";
import { getSupportNumber } from "../server/db/getSuportNumber";
import styles from "../styles/Privacidade.module.scss";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";

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

interface PrivacidadeProps {
  supportNumber: string;
}

const Privacidade: NextPage<PrivacidadeProps> = ({
  supportNumber,
}: PrivacidadeProps) => {
  const { data: auth } = useSession();

  const { data: user } = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);

  const updateMutation = trpc.useMutation("user.updatePassword", {
    onSuccess() {
      notify("Senha alterada com sucesso!", true);
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const [firstPassword, setFirstPassword] = useState("");
  const [secondPassword, setSecondPassword] = useState("");

  const handleFirstPassword = (event: ChangeEvent<HTMLInputElement>) => {
    setFirstPassword(event.target.value);
  };

  const handleSecondPassword = (event: ChangeEvent<HTMLInputElement>) => {
    setSecondPassword(event.target.value);
  };

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (
      firstPassword.toLowerCase().trim() === secondPassword.toLowerCase().trim()
    ) {
      try {
        const response = await fetch("/api/update-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: String(user?.id),
            password: secondPassword,
          }),
        });

        if (response.status === 200) {
          notify("Senha alterada com sucesso!", true);
        } else {
          notify("Não foi possível realizar a operação!", false);
        }
      } catch (error) {
        notify("Ocorreu um erro ao tentar alterar a senha", false);
      }
    } else {
      notify("As senhas não são as mesmas!", false);
    }
  };

  return (
    <>
      <Head>
        <title>Privacidade - NEXTGAIN</title>
        <meta name="description" content="Privacidade - NEXTGAIN" />
      </Head>
      <Header supportNumber={supportNumber} />
      <section className={styles.container}>
        <div className={styles.modalBackground}>
          <form
            className={styles.modalContainer}
            action="#"
            onSubmit={handleFormSubmit}
          >
            <header className={styles.modalHeader}>
              <h3>Alterar senha</h3>
            </header>
            <div className={styles.userDetails}>
              <div className={styles.inputBox}>
                <span className={styles.details}>Nova senha</span>
                <input
                  type="text"
                  id="firstPassword"
                  placeholder="Nova senha"
                  required
                  onChange={handleFirstPassword}
                />
              </div>
              <div className={styles.inputBox}>
                <span className={styles.details}>Confirmar senha</span>
                <input
                  type="text"
                  id="secondPassword"
                  placeholder="Confirmar senha"
                  required
                  onChange={handleSecondPassword}
                />
              </div>
            </div>
            <footer className={styles.footer}>
              <a className={styles.voltarBtn}>
                <Link href="/">Voltar</Link>
              </a>
              <button className={styles.addBtn} type="submit">
                Alterar
              </button>
            </footer>
          </form>
        </div>
      </section>
    </>
  );
};

export default Privacidade;

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

  let supportNumber = null;
  try {
    supportNumber = await getSupportNumber();
  } catch (error) {
    console.error("Error fetching support number:", error);
  }

  return {
    props: { supportNumber },
  };
};
