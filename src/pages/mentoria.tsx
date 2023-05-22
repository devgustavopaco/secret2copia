import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Mentoria.module.scss";
import { Header } from "../components/Header";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Navigation } from "swiper";
import { modules } from "../utils/videos";
import { AiOutlinePlayCircle } from "react-icons/ai";
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
      <div className={`${styles.videoSection} container`}>
        <div className={styles.titleVideo}>
          <img src="images/Tools.svg" alt="icon de play" />
          <span className={styles.title}>Assistir aulas</span>
        </div>{" "}
        <div className={styles.sliders}>
          <Swiper
            slidesPerView={slidesPerView}
            spaceBetween={20}
            navigation={true}
            pagination={{ clickable: true }}
            modules={[Navigation]}
            className="mySwiper"
          >
            {modules.map((module) => (
              <React.Fragment key={module.moduleTitle}>
                <h3>{module.moduleTitle}</h3>
                {module.videos.map((video) => (
                  <SwiperSlide key={video.title}>
                    <a href={video.url} className={styles.videosWatching}>
                      <img src={video.thumbnail} alt={video.title} />
                      <span className={styles.videosModule}>
                        {module.moduleTitle}
                      </span>
                      <span className={styles.videosTitle}>{video.title}</span>
                      <span className={styles.videosButton}>
                        Assistir{" "}
                        <AiOutlinePlayCircle
                          size={20}
                          className={styles.videosIcon}
                        />
                      </span>
                    </a>
                  </SwiperSlide>
                ))}
              </React.Fragment>
            ))}
          </Swiper>
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
            {modules.map((call) => (
              <React.Fragment key={call.moduleTitle}>
                <SwiperSlide>
                  <a href={call.link}>
                    <img src={call.thumbnail} alt={call.moduleTitle} />
                  </a>
                </SwiperSlide>
              </React.Fragment>
            ))}
          </Swiper>
        </div>
      </div>
    </>
  );
};

export default Home;
