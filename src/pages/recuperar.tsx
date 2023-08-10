import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession } from "next-auth/next";
import { useCallback, useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import Router from "next/router";
import { CheckCircle, XCircle } from "phosphor-react";
import { toast } from "react-toastify";
import styles from "../styles/Login.module.scss";
import { authOptions } from "./api/auth/[...nextauth]";

const Login: NextPage = () => {
  const [email, setEmail] = useState("");
  const [backgroundIndex, setBackgroundIndex] = useState(1);

  const backgrounds = [
    "/images/login.png",
    "/images/login2.png",
    "/images/login3.png",
  ];

  const handleBackgroundChange = useCallback(() => {
    setBackgroundIndex(
      (backgroundIndex) => (backgroundIndex + 1) % backgrounds.length
    );
  }, []);

  useEffect(() => {
    const intervalId = setInterval(handleBackgroundChange, 5000);

    return () => clearInterval(intervalId);
  }, [handleBackgroundChange]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.status === 200) {
        toast.dark("Nova senha enviada para seu email!", {
          icon: <CheckCircle size={32} color="#07bc0c" weight="fill" />,
        });
        return Router.push("/");
      } else {
        toast.dark("Email inválido!", {
          icon: <XCircle size={32} color="#ff3838" weight="fill" />,
        });
        setEmail("");
      }
    } catch (error) {
      toast.dark("Email inválido!", {
        icon: <XCircle size={32} color="#ff3838" weight="fill" />,
      });
      setEmail("");
    }
  };

  return (
    <>
      <section className={styles.body}>
        <div style={{ display: "none" }}>
          {backgrounds.map((bg, index) => (
            <Image key={index} src={bg} layout="fill" />
          ))}
        </div>
        <section className={styles.halfLeft}>
          <Link href="/">
            <a>
              <div className={styles.contentBox}>
                <img src="images/logoBranca.svg" alt="Logo da nextGain" />
              </div>
            </a>
          </Link>
        </section>
        <section className={styles.halfRight}>
          <div className={styles.contentBox}>
            <div className={styles.formBoxForget}>
              <h1>Esqueceu sua senha?</h1>
              <p style={{ marginTop: 0 }}>
                Enviaremos uma nova senha no seu email cadastrado
              </p>
              <form action="" onSubmit={handleSubmit}>
                <div className={styles.inputBox}>
                  <span>Email</span>
                  <input
                    type="text"
                    value={email}
                    onChange={handleEmailChange}
                  />
                </div>
                <div className={styles.inputBox}>
                  <button type="submit">ENVIAR</button>
                </div>
              </form>
            </div>
            <section className={styles.comeBack}>
              <Link href="/">
                <a>
                  <span>Voltar</span>
                </a>
              </Link>
            </section>
          </div>
        </section>
      </section>
    </>
  );
};

export default Login;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session) {
    return {
      props: {},
    };
  }

  return {
    redirect: {
      destination: "/monitor",
      permanent: false,
    },
  };
};
