import type { NextPage } from 'next'
import { Trash, UserCirclePlus } from 'phosphor-react'
import { DataGridUsers } from '../../components/GridComponents/DataGridUsers'
import { SideBarAdmin } from '../../components/Admin/SideBarAdmin'
import { TopBarAdmin } from '../../components/Admin/TopBarAdmin'
import styles from '../../styles/Admin.module.scss'
import { useState } from 'react'
import { ModalDeleteUser } from '../../components/Modals/ModalDeleteUser'
import { ModalAddUser } from '../../components/Modals/ModalAddUser'

const AdminUsers: NextPage = () => {
  const [modalOpenDelete, setModalOpenDelete] = useState(false)
  const [modalOpenAdd, setModalOpenAdd] = useState(false)
  return (
    <>
      {modalOpenDelete && <ModalDeleteUser setOpenModal={setModalOpenDelete} />}
      {modalOpenAdd && <ModalAddUser setOpenModal={setModalOpenAdd} />}
      <TopBarAdmin />
      <div className={styles.buttonList}>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            setModalOpenAdd(true)
          }}
        >
          Adicionar
          <UserCirclePlus size={24} />
        </button>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => {
            setModalOpenDelete(true)
          }}
        >
          Excluir
          <Trash size={24} />
        </button>
      </div>
      <div className={styles.container}>
        <SideBarAdmin />
        <DataGridUsers />
      </div>
    </>
  )
}

export default AdminUsers
