import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { Header } from "../../components/Header";
import { ProVideosExperience } from "../../components/VideosPage/ProVideosExperience";
import { getSupportNumber } from "../../server/db/getSuportNumber";
import { trpc } from "../../utils/trpc";
import { authOptions } from "../api/auth/[...nextauth]";

interface VideoProps {
  supportNumber: string;
}

const VideoPage: NextPage<VideoProps> = ({ supportNumber }: VideoProps) => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { data: aulas, isLoading } = trpc.useQuery(["videos.getVideos"], {
    ssr: true,
    context: {
      skipBatch: true,
    },
  });

  return (
    <>
      <Head>
        <title>Aulas - NEXTGAIN</title>
        <meta name="description" content="Aulas e vídeos - NEXTGAIN" />
      </Head>
      <Header supportNumber={supportNumber} />
      <ProVideosExperience
        videos={aulas || []}
        isLoading={isLoading}
        initialVideoId={id}
      />
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
