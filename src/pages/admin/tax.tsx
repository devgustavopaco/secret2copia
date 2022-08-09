import type { GetServerSideProps, NextPage } from 'next'
import { SidebarAdmin } from '../../components/Admin/SidebarAdmin'

import styles from '../../styles/Admin.module.scss'
import { DataGridTaxes } from '../../components/GridComponents/DataGridTaxes'
import { CurrencyEth, Trash } from 'phosphor-react'
import { useState } from 'react'
import { trpc } from '../../utils/trpc'
import { ModalAddTax } from '../../components/Modals/Taxes/ModalAddTax'
import Head from 'next/head'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { Header } from '../../components/Header'

const AdminTaxPage: NextPage = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const createTaxMutation = trpc.useMutation('tax.create', {
    onSuccess() {
      refetch()
    },
    onError(error) {
      console.error(error.message)
    },
  })

  const { data: taxes, isLoading, refetch } = trpc.useQuery(['tax.getTaxes'])

  const deleteMutation = trpc.useMutation('tax.delete', {
    onSuccess() {
      refetch()
    },
    onError(error) {
      console.error(error.message)
    },
  })

  const handleTaxCreate = (
    exchangeId: string,
    coinId: string,
    tax: number,
    confirmations: number
  ) => {
    createTaxMutation.mutate({
      exchangeId,
      coinId,
      tax,
      confirmations,
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
        <title>Taxas</title>
        <meta name="description" content="Taxas" />
      </Head>

      {modalOpen && (
        <ModalAddTax onClose={handleClose} onSubmit={handleTaxCreate} />
      )}
      <Header />
      <div className={`${styles.content} container`}>
        <SidebarAdmin />
        <main>
          <div className={styles.pageHeader}>
            <h1>Taxas</h1>

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
                <CurrencyEth size={24} />
              </button>
            </div>
          </div>
          <div className={styles.container}>
            <DataGridTaxes
              data={taxes || []}
              isLoading={isLoading}
              onSelect={handleSelection}
            />
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
