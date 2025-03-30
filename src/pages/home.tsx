import { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Autoplay, Navigation } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Header } from "../components/Header";
import { logUserAccess } from "../server/db/access/logUserAccess";
import { getSupportNumber } from "../server/db/getSuportNumber";
import styles from "../styles/Home.module.scss";
import { authOptions } from "./api/auth/[...nextauth]";

interface HomeProps {
  supportNumber: string;
}

const Home: NextPage<HomeProps> = ({ supportNumber }: HomeProps) => {
  const [slidesPerView, setSlidesPerView] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;

      if (screenWidth < 500) {
        setSlidesPerView(1.5);
      } else {
        setSlidesPerView(5);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  return (
    <>
      <Head>
        <title>Home - NEXTGAIN</title>
        <meta name="description" content="Privacidade - NEXTGAIN" />
      </Head>

      <div className={styles.container}>
        <Header supportNumber={supportNumber} invisibleBackground={true} />
        <div className={`${styles.banner} container `}>
          <img src="images/logoSeries.svg" alt="Next Gain Series" />
          <span className={styles.title}>
            Bem vindo(a) à Next Gain, o melhor do mundo da arbitragem para você!
          </span>
          <span className={styles.text}>
            Aqui você acessa todas as suas mentorias, monitor de arbitragem em
            tempo real, materiais complementares, contato direto e muito mais...
          </span>
          <Link className={styles.linkButton} href="/videos">
            <button className={styles.buttonWatch}>
              Assistir Agora{" "}
              <img
                className={styles.image}
                src="images/arrowButtonBlack.svg"
                alt="flecha do botão"
              />
            </button>
          </Link>
        </div>
      </div>
      <div className={`${styles.mentoring} container`}>
        <div className={styles.titleMentoring}>
          <img src="images/crypto.svg" alt="icon de play" />
          <span className={styles.title}>Cadastre-se nas corretoras</span>
        </div>
        <div className={styles.sliders} style={{ cursor: "pointer" }}>
          <Swiper
            slidesPerView={slidesPerView}
            spaceBetween={20}
            navigation={true}
            autoplay={{ delay: 2500 }}
            pagination={{ clickable: true }}
            modules={[Navigation, Autoplay]}
            className="mySwiper"
          >
            <SwiperSlide>
              <Link href="https://accounts.binance.com/pt-BR/register?ref=WLQITS2S">
                <img src="/binance-capa.png" alt="Binance" />
              </Link>
            </SwiperSlide>

            <SwiperSlide>
              {" "}
              <Link href="https://www.bitget.com/pt/">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Frame%2031799.png?alt=media&token=7acee02e-5ba8-4759-93b0-497143457cbe"
                  alt="BITGET"
                />
              </Link>
            </SwiperSlide>

            <SwiperSlide>
              {" "}
              <Link href="https://www.bybit.com/pt-BR/sign-up?affiliate_id=91335&group_id=533471&group_type=1&ref_code=91335">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FBYBIT.png?alt=media&token=4bc1c73d-83c0-4493-b52f-19356dea1b90"
                  alt="BYBIT"
                />
              </Link>
            </SwiperSlide>

            <SwiperSlide>
              {" "}
              <Link href="https://www.gate.io/pt/signup?ref=11959860">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FGATEIO.png?alt=media&token=b9e29663-8a2e-430f-9d57-6645d0dd8833"
                  alt="GATEIO"
                />
              </Link>
            </SwiperSlide>

            <SwiperSlide>
              {" "}
              <Link href="https://www.mexc.com/login?inviteCode=1SUJa">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FMEXC.png?alt=media&token=03e060cf-bcfa-41dd-8136-f10991ea34bb"
                  alt="MEXC"
                />
              </Link>
            </SwiperSlide>
          </Swiper>
        </div>
        <div className={styles.titleMentoring} style={{ marginTop: "3.5Rem" }}>
          <img src="images/play.svg" alt="icon de play" />
          <span className={styles.title}>Mentoria</span>
        </div>
        <div className={styles.sliders} style={{ cursor: "pointer" }}>
          <Swiper
            slidesPerView={slidesPerView}
            spaceBetween={20}
            navigation={true}
            pagination={{ clickable: true }}
            modules={[Navigation]}
            className="mySwiper"
          >
            <SwiperSlide>
              <Link href="/videos/cl9ellbn4000209l1gnc9wslt">
                <img src="/capa-aula1.png" alt="Boas vindas" />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9ely3ir013609l1e4bew8qi">
                <img src="/capa-aula2.png" alt="Mundo das cryptos" />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em0t6n018509l14gmsjjib">
                <img src="/capa-aula3.png" alt="O que eh arbitragem" />
              </Link>
            </SwiperSlide>

            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em1ux1022809l18972cfrx">
                <img src="/capa-aula4.png" alt="Email seguro" />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em32qy025409l133i46mil">
                <img src="/capa-aula5.png" alt="Abrindo conta" />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="videos/cl9em4tlp012409l23qnhwai5">
                <img src="/capa-aula6.png" alt="Navegando nas corretoras" />
              </Link>
            </SwiperSlide>
          </Swiper>
        </div>

        <div className={styles.titleTools}>
          <img src="images/Tools.svg" alt="icon de ferramentas" />
          <span className={styles.title}>Ferramentas</span>
        </div>
        <div className={styles.sliders} style={{ cursor: "pointer" }}>
          <Swiper
            slidesPerView={slidesPerView}
            spaceBetween={36}
            navigation={true}
            pagination={{ clickable: true }}
            modules={[Navigation]}
            className="mySwiper"
          >
            <SwiperSlide>
              <Link href="/futuros">
                <img
                  src="images/bannersModulos/criptoMonitor.png"
                  alt="Cripto Monitor"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://docs.google.com/spreadsheets/d/1CNr2m9WHAiKePLTRszlUexfH_c5kx-ONDiixw6YSNHg/edit?usp=sharing">
                <img
                  src="images/bannersModulos/planilhadeGanhos.png"
                  alt="Plahnilha de ganhos"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <a target="_blank" href={supportNumber} rel="noopener noreferrer">
                {" "}
                <img
                  src="images/bannersModulos/centralRecursos.png"
                  alt="Central de recursos"
                />
              </a>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </>
  );
};
export default Home;
//

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;

  const session = await getServerSession(req, context.res, authOptions);

  const userId = session?.id as string;

  const forwarded = req.headers["x-forwarded-for"] as string;
  const ip =
    (forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress) ??
    "0.0.0.0";
  if (session) {
    await logUserAccess(ip as string, userId, req.headers["user-agent"] || "");
  }
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
