import type { NextPage } from 'next'
import { SideBarAdmin } from '../../components/Admin/SideBarAdmin'
import { TopBarAdmin } from '../../components/Admin/TopBarAdmin'
import styles from '../../styles/Admin.module.scss'
import { DataGridExchanges } from '../../components/GridComponents/DataGridExchanges'

const AdminExchanges: NextPage = () => {
  return (
    <>
      <TopBarAdmin />
      <div className={styles.container}>
        <SideBarAdmin />
        <DataGridExchanges />
      </div>
    </>
  )
}

export default AdminExchanges
