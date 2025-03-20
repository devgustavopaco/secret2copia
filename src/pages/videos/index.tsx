import type { Videos } from "@prisma/client";
import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { BeatLoader } from "react-spinners";
import { Header } from "../../components/Header";
import { DesktopClassScheduleComponent } from "../../components/VideosPage/ClassSchedule/Desktop";
import { VideoComponent } from "../../components/VideosPage/Video";
import { getSupportNumber } from "../../server/db/getSuportNumber";
import styles from "../../styles/Videos.module.scss";
import { trpc } from "../../utils/trpc";
import { authOptions } from "../api/auth/[...nextauth]";

interface VideosProps {
  supportNumber: string;
}

const Videos: NextPage<VideosProps> = ({ supportNumber }: VideosProps) => {
  const { data: videos } = trpc.useQuery(["videos.getVideos"], {
    ssr: true,
    context: {
      skipBatch: true,
    },
  });

  const firstClass = videos ? videos[0] : ({} as Videos);
  console.log(videos, "Videos");
  return (
    <>
      <Head>
        <title>Treinamento - NEXTGAIN</title>
        <meta name="description" content="Treinamento - NEXTGAIN" />
      </Head>
      <Header supportNumber={supportNumber} />
      <section className={styles.container}>
        {firstClass ? (
          <VideoComponent aula={firstClass} data={videos || []} />
        ) : (
          <BeatLoader color="#969696" size="0.5rem" />
        )}
        <DesktopClassScheduleComponent data={videos || []} />
      </section>
    </>
  );
};

export default Videos;

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
