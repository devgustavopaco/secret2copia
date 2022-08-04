import type { NextPage } from 'next'
import { SideBarAdmin } from '../../components/Admin/SideBarAdmin'
import { TopBarAdmin } from '../../components/Admin/TopBarAdmin'
import styles from '../../styles/Admin.module.scss'
import { DataGridCryptos } from '../../components/GridComponents/DataGridCryptos'
import { CurrencyEth } from 'phosphor-react'
import { useState } from 'react'
import { ModalAddCrypto } from '../../components/Modals/ModalAddCrypto'
import { trpc } from '../../utils/trpc'

const AdminExchanges: NextPage = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const createCryptoMutation = trpc.useMutation('coin.create', {
    onSuccess() {
      console.log('success')
    },
    onError(error) {
      console.error(error.message)
    },
  })

  const handleCryptoCreate = (ticker: string, name: string, image: File) => {
    createCryptoMutation.mutate({
      active: true,
      image_url: 'teste',
      name,
      ticker,
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
      <TopBarAdmin />
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
      <div className={styles.container}>
        <SideBarAdmin />
        <DataGridCryptos />
      </div>
    </>
  )
}

export default AdminExchanges
