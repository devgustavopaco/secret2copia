import type { NextPage } from 'next'
import { Trash, UserCirclePlus } from 'phosphor-react'
import { DataGridUsers } from '../../components/GridComponents/DataGridUsers'
import { SideBarAdmin } from '../../components/Admin/SideBarAdmin'
import { TopBarAdmin } from '../../components/Admin/TopBarAdmin'
import styles from '../../styles/Admin.module.scss'
import { useEffect, useState } from 'react'
import { ModalDeleteUser } from '../../components/Modals/ModalDeleteUser'
import { ModalAddUser } from '../../components/Modals/ModalAddUser'
import { trpc } from '../../utils/trpc'

const AdminUsers: NextPage = () => {
  const [modalOpenDelete, setModalOpenDelete] = useState(false)
  const [modalOpenAdd, setModalOpenAdd] = useState(false)
  const [itemDeleted, setItemDeleted] = useState(false)
  const [idsFromGrid, setIds] = useState<string[]>([])

  const {
    data: users,
    isLoading,
    refetch,
  } = trpc.useQuery(['user.getAllUsers'])
  useEffect(() => {
    if (idsFromGrid.length !== 0) {
      deleteUserMutation.mutate({
        ids: idsFromGrid,
      })
    }
  }, [itemDeleted])

  const createUserMutation = trpc.useMutation('user.create', {
    onSuccess() {
      console.log('success')
      refetch()
    },
    onError(error) {
      console.error(error.message)
    },
  })

  const deleteUserMutation = trpc.useMutation('user.delete', {
    onSuccess() {
      console.log('success')
      refetch()
    },
    onError(error) {
      console.error(error.message)
    },
  })
  // Create
  const handleUserCreate = (
    name: string,
    email: string,
    phone: string,
    pricePaid: number,
    password: string
  ) => {
    createUserMutation.mutate({
      name,
      email,
      pricePaid,
      phone,
      password,
    })
  }

  const handleUserDelete = (ids: string[]) => {
    setIds(ids)
  }

  return (
    <>
      {modalOpenDelete && (
        <ModalDeleteUser
          setOpenModal={setModalOpenDelete}
          deleted={setItemDeleted}
        />
      )}
      {modalOpenAdd && (
        <ModalAddUser
          setOpenModal={setModalOpenAdd}
          onSubmit={handleUserCreate}
        />
      )}
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
        <DataGridUsers
          onDelete={handleUserDelete}
          data={users || []}
          isLoading={isLoading}
        />
      </div>
    </>
  )
}

export default AdminUsers
