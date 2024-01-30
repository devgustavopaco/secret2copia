import { ReactElement } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { NextPageWithLayout } from "../../_app";
import styles from "../../../styles/teste.module.scss";
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import CustomPieChart from "../../../components/GraphTest";
import { Chart } from "../../../components/Admin/Chart";
import { FeaturedInfo } from "../../../components/Admin/FeaturedInfo";
import { WidgetSm } from "../../../components/Admin/WidgetSm";
import { WidgetLg } from "../../../components/Admin/WidgetLg";
const dashboard: NextPageWithLayout = () => {
  return (
    <>
      <main className={styles.container}>
        <div className={styles.content}>
          {/* <div className={styles.topPart}>
            <h1>Dashboard</h1>
            <div className={styles.doubleWidget}>
              <div className={styles.leftWidget}>
                <div className={styles.headerWidget}>
                  🔥 <p>Moedas em alta</p>
                </div>
                <div className={styles.bodyWidget}>
                  <div className={styles.row}>
                    <div className={styles.coinTitle}>
                      <img src="/Bitcoin.svg" alt="" />

                      <p>
                        <strong>Bitcoin</strong>
                      </p>
                      <p>BTC</p>
                    </div>
                    <span> 2.30%</span>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.coinTitle}>
                      <img src="/Bitcoin.svg" alt="" />

                      <p>
                        <strong>Bitcoin</strong>
                      </p>
                      <p>BTC</p>
                    </div>
                    <span> 2.30%</span>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.coinTitle}>
                      <img src="/Bitcoin.svg" alt="" />

                      <p>
                        <strong>Bitcoin</strong>
                      </p>
                      <p>BTC</p>
                    </div>
                    <span> 2.30%</span>
                  </div>
                </div>
              </div>
              <div className={styles.rightWidget}>
                <CustomPieChart />
              </div>
            </div>
          </div> */}
          <div className={styles.middlePart}>
            <div className={styles.middletitle}>
              <h1>Vendas</h1>
            </div>
            <FeaturedInfo />
            <Chart />
            {/* <div className={styles.homeWidgets}>
              <WidgetSm />
              <WidgetLg />
            </div> */}
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
