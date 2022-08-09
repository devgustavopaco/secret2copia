import type { NextPage } from 'next'
import { SidebarAdmin } from '../../components/Admin/SidebarAdmin'
import { HeaderAdmin } from '../../components/Admin/HeaderAdmin'
import styles from '../../styles/Admin.module.scss'
import { DataGridCryptos } from '../../components/GridComponents/DataGridCryptos'
import { CurrencyEth, Trash } from 'phosphor-react'
import { useState } from 'react'
import { ModalAddCrypto } from '../../components/Modals/ModalAddCrypto'
import { trpc } from '../../utils/trpc'

const AdminExchanges: NextPage = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const { data: coins, isLoading, refetch } = trpc.useQuery(['coin.getCoins'])

  const deleteMutation = trpc.useMutation('coin.delete', {
    onSuccess() {
      refetch()
    },
    onError(error) {
      console.error(error.message)
    },
  })

  const createCryptoMutation = trpc.useMutation('coin.create', {
    onSuccess() {
      refetch()
    },
    onError(error) {
      console.error(error.message)
    },
  })

  const handleCryptoCreate = (ticker: string, name: string) => {
    createCryptoMutation.mutate({
      active: true,
      name,
      ticker,
    })
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
      {modalOpen && (
        <ModalAddCrypto
          setOpenModal={setModalOpen}
          onSubmit={handleCryptoCreate}
        />
      )}
      <HeaderAdmin />
      <div className={`${styles.content} container`}>
        <SidebarAdmin />
        <main>
          <div className={styles.pageHeader}>
            <h1>Cryptos</h1>

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
            <DataGridCryptos
              data={coins || []}
              isLoading={isLoading}
              onSelect={handleSelection}
            />
          </div>
        </main>
      </div>
    </>
  )
}

export default AdminExchanges
