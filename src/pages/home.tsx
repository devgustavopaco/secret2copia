import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Navigation } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Header } from "../components/Header";
import styles from "../styles/Home.module.scss";

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
          <Link className={styles.linkButton} href="/videos">
            <button className={styles.buttonWatch}>
              Assistir Agora{" "}
              <img
                className={styles.image}
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
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/newboasvindas.webp?alt=media&token=e0081a11-3c7d-4d98-a439-8bbf4c6b4aa2"
                  alt="Boas vindas"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9ely3ir013609l1e4bew8qi">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/mundodascrypto.webp?alt=media&token=5acd6d32-c9fa-4c2a-bda4-8e1cd576aa1e"
                  alt="Mundo das cryptos"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em0t6n018509l14gmsjjib">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/oqeharbitragem.webp?alt=media&token=2965c9e4-d7e5-486c-9654-350eacc69ace"
                  alt="O que eh arbitragem"
                />
              </Link>
            </SwiperSlide>

            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em1ux1022809l18972cfrx">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/emailseguro.webp?alt=media&token=1c3fb461-4df9-4647-a5ee-c9839d380a86"
                  alt="Email seguro"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em32qy025409l133i46mil">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/criandocontas.webp?alt=media&token=4b4c9b4f-e28c-4128-b64f-93c048f4ba73"
                  alt="Abrindo conta"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="videos/cl9em4tlp012409l23qnhwai5">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/navegando.webp?alt=media&token=69826d5d-95ca-4b47-a744-d1785e6e7689"
                  alt="Navegando nas corretoras"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/clmt7f1ao0004p6a8miwnsccs">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/operandonascorretoras.webp?alt=media&token=c1a62982-06a1-42d2-8b40-80a76f0ff83c"
                  alt="Operando nas corretoras"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/clmt7hbpm0007p6a824vsmqu4">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/transferenciasedepositos.webp?alt=media&token=3683fc0f-c7f3-4e6d-9797-debf8c3661d0"
                  alt="Transferencias e depositos"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/exercicios.webp?alt=media&token=6eba82a6-7430-4092-94cd-9843a4fca959"
                  alt="Exercicios praticos"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/clmt7jl02000cp6a8yrazj36y">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/modulo10.png?alt=media&token=a694cae3-9f66-4146-902b-f66e8fb63b69&_gl=1*1n76p48*_ga*MTI4MjkzNjc3Ni4xNjg2NjAyODU3*_ga_CW55HF8NVT*MTY5NTk1ODUzNS4yOC4xLjE2OTU5NTg1NjcuMjguMC4w"
                  alt="Plataforma de arbitragem"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/operandonocelular.webp?alt=media&token=c1657de0-b46f-495c-bc57-2b1c51fd6355"
                  alt="Operando no celular"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://nextgain.com.br/videos/clmt7n2ue000ip6a8wpcb2n53">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/minimizandoriscos.webp?alt=media&token=b5d82bc7-d5d9-4496-8e05-b1e8637d8976"
                  alt="Minimizando os riscos"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/clmt7sbni000lp6a8rqx8ubq4">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/dicas%20e%20bonus.webp?alt=media&token=8939a09a-427d-425e-aeef-4e3bfa903704"
                  alt="Dicas e Bonus"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9elr6r3000909l2ktyyup5v">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/nextgain-37481.appspot.com/o/conclusao.webp?alt=media&token=3f858906-cd17-4df5-895a-0adc2fdd875f"
                  alt="Dicas e Bonus"
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
              <Link href="https://docs.google.com/spreadsheets/u/0/d/1-uxKr9Y1UcPQ0yHd9DwomqTAQFKvQgUQurgjtrXZbhE/edit?usp=sharing&pli=1">
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
