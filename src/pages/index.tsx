import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { GetServerSideProps, NextPage } from "next";
import { signIn } from "next-auth/react";
import Router from "next/router";
import { useState } from "react";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { toast } from "react-toastify";
import animationData from "../../public/animations/loadingNextgain.json";

import { unstable_getServerSession } from "next-auth/next";
import Link from "next/link";

import dynamic from "next/dynamic";
import { XCircle } from "phosphor-react";
import styles from "../styles/Login.module.scss";
import { authOptions } from "./api/auth/[...nextauth]";
const Lottie = dynamic(() => import("react-lottie"), {
  ssr: false,
});

const LoginWithCaptha = () => {
  const RECAPTCHA_SITE_KEY = "6Lf7sbMlAAAAAP2FYf141iFvvxtf94odSx_kLKBa";

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <Login />
    </GoogleReCaptchaProvider>
  );
};

export default LoginWithCaptha;

const Login: NextPage = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!email || !password) {
      toast.dark("Por favor, preencha o email e a senha.", {
        icon: <XCircle size={32} color="#ff3838" weight="fill" />,
      });
      return;
    }
    e.preventDefault();
    setIsLoading(true);

    if (!executeRecaptcha) {
      setIsLoading(false);
      return;
    }

    const recaptchaToken = await executeRecaptcha("login");

    const response = await signIn("credentials", {
      redirect: false,
      email,
      password,
      recaptchaToken,
    });

    if (response?.error) {
      toast.dark(response.error, {
        icon: <XCircle size={32} color="#ff3838" weight="fill" />,
      });
      setIsLoading(false);
      console.error(response.error);
      return Router.push("/");
    }

    return Router.push("/home");
  };

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <>
      <section className={styles.body}>
        <section className={styles.halfLeft}>
          <div className={styles.contentBox}>
            <img src="images/logoBranca.svg" alt="Logo da nextGain" />
          </div>
        </section>
        <section className={styles.halfRight}>
          <div className={styles.contentBox}>
            <div className={styles.formBox}>
              <h1>Bem-vindo à Next Gain</h1>
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
                  <span>Senha</span>
                  <div className={styles.inputPassword}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                    />
                    <FontAwesomeIcon
                      className={styles.eyeIcon}
                      icon={showPassword ? faEyeSlash : faEye}
                      onClick={toggleShowPassword}
                      width={24}
                      height={24}
                    />
                  </div>
                </div>
                <div className={styles.inputBox}>
                  <button type="submit">
                    {isLoading ? (
                      <Lottie options={defaultOptions} height={50} width={50} />
                    ) : (
                      <>
                        Entrar <img src="images/arrowLogin.svg" alt="" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            <section className={styles.forgotPassword}>
              <Link href="/recuperar">
                <a>
                  <span>Esqueci minha senha</span>
                </a>
              </Link>
            </section>
          </div>
        </section>
      </section>
    </>
  );
};

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
  //
  return {
    redirect: {
      destination: "/monitor",
      permanent: true,
    },
  };
};
