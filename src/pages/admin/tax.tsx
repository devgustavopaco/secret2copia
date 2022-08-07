import type { NextPage } from 'next'
import { SidebarAdmin } from '../../components/Admin/SidebarAdmin'
import { HeaderAdmin } from '../../components/Admin/HeaderAdmin'
import styles from '../../styles/Admin.module.scss'
import { DataGridTaxes } from '../../components/GridComponents/DataGridTaxes'
import { CurrencyEth } from 'phosphor-react'
import { useState } from 'react'
import { ModalAddCrypto } from '../../components/Modals/ModalAddCrypto'
import { trpc } from '../../utils/trpc'
import { ModalAddTax } from '../../components/Modals/Taxes/ModalAddTax'
import Head from 'next/head'

const AdminTaxPage: NextPage = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const createTaxMutation = trpc.useMutation('tax.create', {
    onSuccess() {
      console.log('success')
    },
    onError(error) {
      console.error(error.message)
    },
  })

  const { data: taxes, isLoading } = trpc.useQuery(['tax.getTaxes'])

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

  return (
    <>
      <Head>
        <title>Taxas</title>
        <meta name="description" content="Taxas" />
      </Head>

      {modalOpen && (
        <ModalAddTax onClose={handleClose} onSubmit={handleTaxCreate} />
      )}
      <HeaderAdmin />
      <div className={`${styles.content} container`}>
        <SidebarAdmin />
        <main>
          <div className={styles.pageHeader}>
            <h1>Taxas</h1>

            <div className={styles.buttonCryptoList}>
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
            <DataGridTaxes data={taxes || []} />
          </div>
        </main>
      </div>
    </>
  )
}

export default AdminTaxPage
