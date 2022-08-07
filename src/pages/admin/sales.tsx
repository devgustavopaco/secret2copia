import type { NextPage } from 'next'
import { Chart } from '../../components/Admin/Chart'
import { FeaturedInfo } from '../../components/Admin/FeaturedInfo'
import { SidebarAdmin } from '../../components/Admin/SidebarAdmin'
import { HeaderAdmin } from '../../components/Admin/HeaderAdmin'
import { WidgetLg } from '../../components/Admin/WidgetLg'
import { WidgetSm } from '../../components/Admin/WidgetSm'
import styles from '../../styles/Admin.module.scss'

const AdminSales: NextPage = () => {
  return (
    <>
      <HeaderAdmin />
      <main className="container">
        <div className={styles.container}>
          <SidebarAdmin />
          <div className={styles.right}>
            <FeaturedInfo />
            <Chart />
            <div className={styles.homeWidgets}>
              <WidgetSm />
              <WidgetLg />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default AdminSales
