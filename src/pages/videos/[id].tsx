import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { BeatLoader } from "react-spinners";

import { getServerSession } from "next-auth";
import { Header } from "../../components/Header";
import { DesktopClassScheduleComponent } from "../../components/VideosPage/ClassSchedule/Desktop";
import { VideoComponent } from "../../components/VideosPage/Video";
import { getSupportNumber } from "../../server/db/getSuportNumber";
import styles from "../../styles/SingleVideo.module.scss";
import { trpc } from "../../utils/trpc";
import { authOptions } from "../api/auth/[...nextauth]";

interface VideoProps {
  supportNumber: string;
}

const VideoPage: NextPage<VideoProps> = ({ supportNumber }: VideoProps) => {
  const router = useRouter();

  let { id } = router.query as { id: string };

  const { data: singleVideo } = trpc.useQuery(["videos.getVideoById", { id }]);

  const { data: aulas } = trpc.useQuery(["videos.getVideos"]);

  return (
    <>
      <Head>
        <title>Treinamento - NEXTGAIN</title>
        <meta name="description" content="Treinamento - NEXTGAIN" />
      </Head>
      <Header supportNumber={supportNumber} />
      <section className={styles.container}>
        {singleVideo ? (
          <VideoComponent aula={singleVideo} data={aulas || []} />
        ) : (
          <BeatLoader color="#969696" size="0.5rem" />
        )}
        <DesktopClassScheduleComponent data={aulas || []} />
      </section>
    </>
  );
};

export default VideoPage;

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
