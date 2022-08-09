import type { NextPage } from 'next'
import { SidebarAdmin } from '../../components/Admin/SidebarAdmin'
import { HeaderAdmin } from '../../components/Admin/HeaderAdmin'
import styles from '../../styles/Admin.module.scss'
import { DataGridExchanges } from '../../components/GridComponents/DataGridExchanges'

const AdminExchanges: NextPage = () => {
  return (
    <>
      <HeaderAdmin />
      <main className="container">
        <div className={styles.container}>
          <SidebarAdmin />
          <DataGridExchanges />
        </div>
      </main>
    </>
  )
}

export default AdminExchanges
