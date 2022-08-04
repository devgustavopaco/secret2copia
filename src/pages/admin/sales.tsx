import type { NextPage } from 'next'
import { Chart } from '../../components/Admin/Chart'
import { FeaturedInfo } from '../../components/Admin/FeaturedInfo'
import { SideBarAdmin } from '../../components/Admin/SideBarAdmin'
import { TopBarAdmin } from '../../components/Admin/TopBarAdmin'
import { WidgetLg } from '../../components/Admin/WidgetLg'
import { WidgetSm } from '../../components/Admin/WidgetSm'
import styles from '../../styles/Admin.module.scss'

const AdminSales: NextPage = () => {
  return (
    <>
      <TopBarAdmin />
      <div className={styles.container}>
        <SideBarAdmin />
        <div className={styles.right}>
          <FeaturedInfo />
          <Chart />
          <div className={styles.homeWidgets}>
            <WidgetSm />
            <WidgetLg />
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminSales
