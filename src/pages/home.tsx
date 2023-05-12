import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.scss";
import { Header } from "../components/Header";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Navigation } from "swiper";
import Link from "next/link";

const Home: NextPage = () => {
  const [slidesPerView, setSlidesPerView] = useState(5);
  const [slidesPerViewTools, setSlidesPerViewTools] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;

      if (screenWidth < 500) {
        setSlidesPerView(1.5);
        setSlidesPerViewTools(1.5);
      } else {
        setSlidesPerView(5);
        setSlidesPerViewTools(5);
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
      <Header />
      <div className={styles.container}>
        <div className={`${styles.banner} container`}>
          <img src="images/logoSeries.svg" alt="Next Gain Series" />
          <span className={styles.title}>
            Bem vindo(a) à Next Gain, o melhor do mundo da arbitragem para você!
          </span>
          <span className={styles.text}>
            Aqui você acessa todas as suas mentorias, monitor de arbitragem em
            tempo real, materiais complementares, contato direto e muito mais...
          </span>
          <Link href="/videos">
            <button className={styles.buttonWatch}>
              Assistir Agora{" "}
              <img
                className={styles.images}
                src="images/arrowButton.svg"
                alt="flecha do botão"
              />
            </button>
          </Link>
        </div>
      </div>
      <div className={`${styles.mentoring} container`}>
        <div className={styles.titleMentoring}>
          <img src="images/play.svg" alt="icon de play" />
          <span className={styles.title}>Mentoria</span>
        </div>
        <div className={styles.sliders}>
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
                <img
                  src="images/bannersModulos/boasVindas.png"
                  alt="Boas vindas"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9elp8r7006709l1jdsyo8jg">
                <img
                  src="images/bannersModulos/entendendoNextGain.png"
                  alt="Entendendo a Next Gain"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9ely3ir013609l1e4bew8qi">
                <img
                  src="images/bannersModulos/criacaoDeConta.png"
                  alt="criação de conta"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9elynpv014909l19qiekub6">
                <img
                  src="images/bannersModulos/entendendoOMonitor.png"
                  alt="Entendendo o monitor"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              <Link href="/videos/cl9em2mz2024109l1slmmabkr">
                <img
                  src="images/bannersModulos/corretoras.png"
                  alt="Corretoras"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em32qy025409l133i46mil">
                <img
                  src="images/bannersModulos/transferenciaESaque.png"
                  alt="Transferencia e saque"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em4tlp012409l23qnhwai5">
                <img
                  src="images/bannersModulos/operandoNaPratica.png"
                  alt="Operando na prática"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9elr6r3000909l2ktyyup5v">
                <img
                  src="images/bannersModulos/dicasSecretas.png"
                  alt="Dicas secretas"
                />
              </Link>
            </SwiperSlide>
          </Swiper>
        </div>

        <div className={styles.titleTools}>
          <img src="images/Tools.svg" alt="icon de ferramentas" />
          <span className={styles.title}>Ferramentas</span>
        </div>
        <div className={styles.sliders}>
          <Swiper
            slidesPerView={slidesPerView}
            spaceBetween={36}
            navigation={true}
            pagination={{ clickable: true }}
            modules={[Navigation]}
            className="mySwiper"
          >
            <SwiperSlide>
              <Link href="/monitor">
                <img
                  src="images/bannersModulos/criptoMonitor.png"
                  alt="Cripto Monitor"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://docs.google.com/spreadsheets/d/1LQs3WQZd1p92-uVJjBWN2oSMAAUx3Pq79V-MOhowRUk/edit#gid=0">
                <img
                  src="images/bannersModulos/planilhadeGanhos.png"
                  alt="Plahnilha de ganhos"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <a
                target="_blank"
                href="https://api.whatsapp.com/send?phone=5511973592971&text=Fala%20Gu%2C%20preciso%20de%20suporte!%20"
                rel="noopener noreferrer"
              >
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
