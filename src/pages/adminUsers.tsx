import type { NextPage } from 'next'
import { DataGridComponent } from '../components/Admin/DataGrid'
import { SideBarAdmin } from '../components/Admin/SideBarAdmin'
import { TopBarAdmin } from '../components/Admin/TopBarAdmin'
import styles from '../styles/Admin.module.scss'

const AdminUsers: NextPage = () => {
  return (
    <>
      <TopBarAdmin />
      <div className={styles.container}>
        <SideBarAdmin />

        <DataGridComponent />
      </div>
    </>
  )
}

export default AdminUsers
