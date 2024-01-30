import { ReactElement } from "react";
import { Chart } from "../../../components/Admin/Chart";
import DashboardLayout from "../../../layouts/DashboardLayout";
import styles from "../../../styles/teste.module.scss";
import { NextPageWithLayout } from "../../_app";
const dashboard: NextPageWithLayout = () => {
  return (
    <>
      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.middlePart}>
            <div className={styles.middletitle}>
              <h1>Vendas</h1>
            </div>
            {/* <FeaturedInfo /> */}
            <Chart />
          </div>
        </div>
      </main>
    </>
  );
};
dashboard.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default dashboard;
