import type { GetServerSideProps, NextPage } from 'next'
import { SidebarAdmin } from '../../components/Admin/SidebarAdmin'
import { HeaderAdmin } from '../../components/Admin/HeaderAdmin'
import styles from '../../styles/Admin.module.scss'

import { Plus, Trash } from 'phosphor-react'
import { useState } from 'react'
import { trpc } from '../../utils/trpc'
import { ModalAddExchange } from '../../components/Modals/Exchange/ModalAddExchange'
import Head from 'next/head'
import { DataGridExchanges } from '../../components/GridComponents/DataGridExchanges'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'

const AdminTaxPage: NextPage = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const createExchangeMutation = trpc.useMutation('exchange.create', {
    onSuccess() {
      refetch()
    },
    onError(error) {
      console.error(error.message)
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
      <HeaderAdmin />
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
