import type { GetServerSideProps, NextPage } from 'next'
import styles from '../../styles/Admin.module.scss'

import { CheckCircle, Plus, Trash, XCircle } from 'phosphor-react'
import { useState } from 'react'
import { trpc } from '../../utils/trpc'
import { ModalAddExchange } from '../../components/Modals/Exchange/ModalAddExchange'
import Head from 'next/head'
import { DataGridExchanges } from '../../components/GridComponents/DataGridExchanges'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { Header } from '../../components/Header'
import { SidebarAdmin } from '../../components/Admin/SideBarAdmin'
import { toast } from 'react-toastify'

const AdminTaxPage: NextPage = () => {
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

  const createExchangeMutation = trpc.useMutation('exchange.create', {
    onSuccess() {
      notify('Exchange criada com sucesso!', true)
      refetch()
    },
    onError(error) {
      notify('Não foi possível realizar a operação!', false)
    },
  })

  const {
    data: exchanges,
    isLoading,
    refetch,
  } = trpc.useQuery(['exchange.getExchanges'])

  const deleteMutation = trpc.useMutation('tax.delete', {
    onSuccess() {
      refetch()
    },
    onError(error) {
      console.error(error.message)
    },
  })

  const handleExchangeCreate = (
    fee: number,
    tag: string,
    name: string,
    image: File,
    convert: boolean
  ) => {
    createExchangeMutation.mutate({
      name,
      tag,
      fee,
      convert,
    })
  }

  const handleClose = () => {
    setModalOpen(false)
  }

  return (
    <>
      <Head>
        <title>Exchanges</title>
        <meta name="description" content="Exchanges" />
      </Head>

      {modalOpen && (
        <ModalAddExchange
          onClose={handleClose}
          onSubmit={handleExchangeCreate}
        />
      )}
      <Header />
      <div className={`${styles.content} container`}>
        <SidebarAdmin />
        <main>
          <div className={styles.pageHeader}>
            <h1>Exchanges</h1>

            <div className={styles.buttonCryptoList}>
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
            <DataGridExchanges data={exchanges || []} isLoading={isLoading} />
          </div>
        </main>
      </div>
    </>
  )
}

export default AdminTaxPage

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session) {
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
