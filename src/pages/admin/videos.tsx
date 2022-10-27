import type { GetServerSideProps, NextPage } from 'next'
import { unstable_getServerSession } from 'next-auth'
import Head from 'next/head'
import { CheckCircle, Plus, Trash, XCircle } from 'phosphor-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { SidebarAdmin } from '../../components/Admin/SidebarAdmin'
import { DataGridVideos } from '../../components/GridComponents/DataGridVideos'
import { Header } from '../../components/Header'
import { ModalAddVideo } from '../../components/Modals/ModalAddVideo'
import styles from '../../styles/Admin.module.scss'
import { trpc } from '../../utils/trpc'
import { authOptions } from '../api/auth/[...nextauth]'

const VideosPage: NextPage = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const notify = (text: string, success: boolean) => {
    if (success) {
      toast.dark(text, {
        icon: <CheckCircle size={32} color="#07bc0c" weight="fill" />,
      })
    } else {
      toast.dark(text, {
        icon: <XCircle size={32} color="#ff3838" weight="fill" />,
      })
    }
  }

  const createVideoMutation = trpc.useMutation('videos.create', {
    onSuccess() {
      notify('Aula criada com sucesso!', true)
      refetch()
    },
    onError(error) {
      notify('Não foi possível realizar a operação!', false)
    },
  })

  const {
    data: videos,
    isLoading,
    refetch,
  } = trpc.useQuery(['videos.getVideos'])

  // console.log(videos)

  const deleteMutation = trpc.useMutation('videos.delete', {
    onSuccess() {
      notify('Video deletada com sucesso!', true)
      refetch()
    },
    onError(error) {
      notify('Não foi possível realizar a operação!', false)
      // console.log(error)
    },
  })

  const handleVideoCreate = async (
    title: string,
    description: string,
    additionalMaterial: string | undefined,
    idYoutube: string,
    createdAt: Date
  ) => {
    createVideoMutation.mutate({
      title,
      description,
      additionalMaterial,
      idYoutube,
      createdAt,
    })
  }

  const handleClose = () => {
    setModalOpen(false)
  }

  const handleSelection = (ids: string[]) => {
    setSelectedIds(ids)
  }

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleDeletion = () => {
    deleteMutation.mutate({
      ids: selectedIds,
    })
  }

  return (
    <>
      <Head>
        <title>Videos</title>
        <meta name="description" content="Videos" />
      </Head>

      {modalOpen && (
        <ModalAddVideo
          setOpenModal={handleClose}
          onSubmit={handleVideoCreate}
        />
      )}
      <Header />
      <div className={`${styles.content} container`}>
        <SidebarAdmin />
        <main>
          <div className={styles.pageHeader}>
            <h1>Videos</h1>

            <div className={styles.buttonCryptoList}>
              <button
                type="button"
                className={styles.addCryptoButton}
                onClick={handleDeletion}
                datatype="remove"
              >
                Remover
                <Trash size={24} />
              </button>
              <button
                type="button"
                className={styles.addCryptoButton}
                onClick={() => {
                  setModalOpen(true)
                }}
              >
                Adicionar
                <Plus size={24} />
              </button>
            </div>
          </div>
          <div className={styles.container}>
            <DataGridVideos
              data={videos || []}
              isLoading={isLoading}
              onDelete={handleSelection}
            />
          </div>
        </main>
      </div>
    </>
  )
}

export default VideosPage

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session || session?.role !== 'admin') {
    return {
      redirect: {
        destination: '/',
        permanent: true,
      },
    }
  }

  return {
    props: {},
  }
}
