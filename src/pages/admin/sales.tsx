import type { GetServerSideProps, NextPage } from "next";
import { Chart } from "../../components/Admin/Chart";
import { FeaturedInfo } from "../../components/Admin/FeaturedInfo";
import { SidebarAdmin } from "../../components/Admin/SidebarAdmin";

import { WidgetLg } from "../../components/Admin/WidgetLg";
import { WidgetSm } from "../../components/Admin/WidgetSm";
import styles from "../../styles/Admin.module.scss";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { Header } from "../../components/Header";

const AdminSales: NextPage = () => {
  return (
    <>
      <Header />
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
  );
};

export default AdminSales;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session || session?.role !== "admin") {
    return {
      redirect: {
        destination: "/",
        permanent: true,
      },
    };
  }

  return {
    props: {},
  };
};
