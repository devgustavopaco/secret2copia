import type { NextPage } from 'next'
import { SideBarAdmin } from '../components/Admin/SideBarAdmin'
import { TopBarAdmin } from '../components/Admin/TopBarAdmin'
import styles from '../styles/Admin.module.scss'
import { DataGridCryptos } from '../components/GridComponents/DataGridCryptos'
import { CurrencyEth } from 'phosphor-react'
import { useState } from 'react'
import { ModalAddCrypto } from '../components/Modals/ModalAddCrypto'

const AdminExchanges: NextPage = () => {
  const [modalOpen, setModalOpen] = useState(false)
  return (
    <>
      {modalOpen && <ModalAddCrypto setOpenModal={setModalOpen} />}
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
