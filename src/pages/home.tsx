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
import { getSupportNumber } from "../server/db/getSuportNumber";
import styles from "../styles/Home.module.scss";
import { authOptions } from "./api/auth/[...nextauth]";
import { logUserAccess } from "../server/db/access/logUserAccess";

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
        <div className={styles.sliders}>
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
              {" "}
              <Link href="https://ascendex.com/en/register">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Frame%203175.png?alt=media&token=49df2a47-67c6-495c-b03d-f2c9fa39daaa"
                  alt="Ascendex"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              <Link href="https://accounts.binance.com/pt-BR/register?ref=WLQITS2S">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Frame%2031754.png?alt=media&token=0d1596ca-ff43-45ed-8eaf-5f9b9f44d5f5"
                  alt="Binance"
                />
              </Link>
            </SwiperSlide>

            <SwiperSlide>
              {" "}
              <Link href="https://bige.one/en/user/new?code=ONE4MLTQ">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Frame%203177.png?alt=media&token=a44943e9-90de-4ded-8e15-1b7a15c74a6c"
                  alt="BIGONE"
                />
              </Link>
            </SwiperSlide>

            <SwiperSlide>
              {" "}
              <Link href="https://bingx.com/pt-br/invite/YXCIPQ/">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Frame%203178.png?alt=media&token=0b750d44-2332-4457-b71c-8d3cc004ee63"
                  alt="BINGX"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://www.bitfinex.com/sign-up/">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Frame%203179.png?alt=media&token=301f1ce7-061f-44ea-b11a-c3f7f0c364f5"
                  alt="BITFINEX"
                />
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
              <Link href="https://www.bitrue.com/activity/kol/landing?cn=600000&inviteCode=WWWVWZW&hl=pt_PT">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FBITRUE.png?alt=media&token=7f367e11-ce6b-403c-8cf3-c34a7193a5b3"
                  alt="BITRUE"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://brasilbitcoin.com.br/registro/Nextcoin">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FBRASIL%20BITCOIN.png?alt=media&token=0da78533-d466-45db-bfd1-235b4b168cde"
                  alt="BRASIL BITCOIN"
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
              <Link href="https://www.coinbase.com/pt-br/join/np6htb">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FCOINBASE.png?alt=media&token=11678f9a-7aa2-4c57-8bf6-51c7ff651da5"
                  alt="COIBASE"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://coinsbit.io/register">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FCOINSBIT.png?alt=media&token=93690983-a078-4f0f-add9-c0158515139d"
                  alt="COINSBIT"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://www.coinw.com/invitePublicity?r=2272479">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FCOINW.png?alt=media&token=54b98ede-f7d5-4d63-a76b-643680e87c6e"
                  alt="COINW"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://auth-x.crypto.com/users/sign_up?ref=8n2hpvr3re">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FCRYPTOCOM.png?alt=media&token=434e42b9-cc9f-4eee-918d-a295dc557322"
                  alt="CRYPTOCOM"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://dex-trade.com/sign-up">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FDEXTRADE.png?alt=media&token=a9f2625f-ef3c-49b0-a609-d8fbedb78d64"
                  alt="DEXTRADE"
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
              <Link href="https://www.htx.com/en-us/v/register/double-invite/web?inviter_id=11343840&invite_code=p3u26223&id=10029&lang=en-us">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FHUOBI.png?alt=media&token=95059fb9-3c4b-4f51-a26c-ae3f9e3c6fac"
                  alt="HUOBI"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://www.kucoin.com/pt/ucenter/signup?rcode=QBS541EN&utm_source=rf">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FKUCOIN.png?alt=media&token=bb42c8b9-1215-4f36-b0b7-97863794d896"
                  alt="KUCOIN"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://latoken.com/exchange/ALL?do=login">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FLATOKEN.png?alt=media&token=5778f969-e79c-4500-9c21-8df83eee57f2"
                  alt="LATOKEN"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://www.lbank.com/login?icode=31J0O">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FLBANK.png?alt=media&token=52d4437c-1a4f-4f95-b9a7-210621cd3499"
                  alt="LBANK"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://conta.mercadobitcoin.com.br/cadastro/?utm_campaign=aquisicao%7Caffiliate-influencer%7Clink%7Cgustavo-nigre%7Cempty%7C20240814&utm_medium=affiliate&utm_source=gustavo-nigre">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FMERCADO%20BITCOIN.png?alt=media&token=048c5862-8bbf-49c9-806b-e0b0daff3f63"
                  alt="MERCADOBITCOIN"
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
            <SwiperSlide>
              {" "}
              <Link href="https://novadax.info/oRVbT9ZE8GrPWdcm9">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FNOVADAX.png?alt=media&token=737ec383-826e-4b39-91a3-2615b2cebbc7"
                  alt="NOVADAX"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://www.okx.com/pt-br/join/62792047">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FOKX.png?alt=media&token=d5b9dd0d-375d-44aa-8b70-3842a8c7e0cc"
                  alt="OKX"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://p2pb2b.com/?referral=fcb94754">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FP2PB2B.png?alt=media&token=2a1f5dfa-55ee-4c15-9ec2-c57300f153ae"
                  alt="2FP2PB2B"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://phemex.com/pt/account/referral/invite-friends-entry?referralCode=J7M6K5">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FPHEMEX.png?alt=media&token=5e8a5b8e-c5f7-4d96-a7ec-05f90530b0de"
                  alt="PHEMEX"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://www.pionex.com/en/signUp?r=J7OW8MdZ">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FPIONEX%203195.png?alt=media&token=8852ee4f-4eb9-4555-b019-eb6a19664496"
                  alt="PIONEX"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://poloniex.com/signup?c=HQD4CQYU">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FPOLONIEX.png?alt=media&token=f5fc13dc-34b5-4c8f-a448-e95a9dee4b1b"
                  alt="POLONIEX"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://whitebit.com/auth/register?referral=60e0f5c3-2913-4e5c-9f07-15cbc3851220">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FWHITEBIT.png?alt=media&token=c8cfce5e-c8c1-4fef-8fb5-7d94fd6b42b9"
                  alt="WHITEBIT"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://woox.io/en/register?ref=YG3NAIN3">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FWOO.png?alt=media&token=be4760de-6908-4e19-846f-79a5e6d9a3f6"
                  alt="WOO"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://www.xt.com/en/accounts/register/start?ref=Y584VF">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/e-link%2Fgoing-to%2FXT.png?alt=media&token=4f70d89d-8812-4e87-9247-dd1c289d36db"
                  alt="XT"
                />
              </Link>
            </SwiperSlide>
          </Swiper>
        </div>
        <div className={styles.titleMentoring} style={{ marginTop: "3.5Rem" }}>
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
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Group%202975.png?alt=media&token=c939ff47-9b51-46bb-afed-461a83ced423"
                  alt="Boas vindas"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9ely3ir013609l1e4bew8qi">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Group%202980.png?alt=media&token=8ae7f2ef-d126-41e6-afd2-0058d6b5a6d4"
                  alt="Mundo das cryptos"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em0t6n018509l14gmsjjib">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Group%202983.png?alt=media&token=4c7f4824-765b-4644-b2e0-0d431c98c90f"
                  alt="O que eh arbitragem"
                />
              </Link>
            </SwiperSlide>

            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em1ux1022809l18972cfrx">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Group%202981.png?alt=media&token=68f497b3-a698-4ff3-b2bd-923cd3b4cfba"
                  alt="Email seguro"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/cl9em32qy025409l133i46mil">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Group%202984.png?alt=media&token=c43815d5-38f2-4037-ac39-e7f5ce7e0d7a"
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
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Group%202986.png?alt=media&token=e6eff4a6-7077-48cb-9ee2-059b1670fff6"
                  alt="Operando nas corretoras"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="/videos/clmt7hbpm0007p6a824vsmqu4">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/bb-queue.appspot.com/o/Group%202985.png?alt=media&token=3456b0ec-7188-487e-ae40-de9f6d780558"
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
              <Link href="/futuros">
                <img
                  src="images/bannersModulos/criptoMonitor.png"
                  alt="Cripto Monitor"
                />
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              {" "}
              <Link href="https://docs.google.com/spreadsheets/d/1F2GnfblewJ5nNQeCumPk5tAEsGZCp40ZzyJ7PTUwKgM/edit?gid=1671346053#gid=1671346053">
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
