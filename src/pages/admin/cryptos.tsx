import type { GetServerSideProps, NextPage } from 'next'
import styles from '../../styles/Admin.module.scss'
import { DataGridCryptos } from '../../components/GridComponents/DataGridCryptos'
import { CheckCircle, CurrencyEth, Trash, XCircle } from 'phosphor-react'
import { useState } from 'react'
import { ModalAddCrypto } from '../../components/Modals/ModalAddCrypto'
import { trpc } from '../../utils/trpc'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { Header } from '../../components/Header'
import { SidebarAdmin } from '../../components/Admin/SideBarAdmin'
import { toast } from 'react-toastify'

const AdminExchanges: NextPage = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const { data: coins, isLoading, refetch } = trpc.useQuery(['coin.getCoins'])

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

  const deleteMutation = trpc.useMutation('coin.delete', {
    onSuccess() {
      notify('Moeda deletada com sucesso!', true)
      refetch()
    },
    onError(error) {
      notify('Não foi possível realizar a operação!', false)
    },
  })

  const createCryptoMutation = trpc.useMutation('coin.create', {
    onSuccess() {
      notify('Moeda criada com sucesso!', true)
      refetch()
    },
    onError(error) {
      notify('Não foi possível realizar a operação!', false)
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
      <Header />
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
