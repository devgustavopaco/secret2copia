import { Box } from "@mui/material";
import {
  DataGrid,
  GridColumns,
  GridRowIdGetter,
  type GridRenderCellParams,
} from "@mui/x-data-grid";

import { GlobalStyles, ThemeProvider, createTheme } from "@mui/material";
import { v4 as uuidV4 } from "uuid";

import { useSession } from "next-auth/react";
import { trpc } from "../../../utils/trpc";
import styles from "./styles.module.scss";

interface DataGridOrderbookProps {
  data: { price: number; amount: number }[];
  isLoading?: boolean;
  isUSD: boolean;
  isPurchase: boolean;
}

const theme = createTheme({
  typography: {
    fontFamily: "IBM Plex Sans, Helvetica Neue, sans-serif",
  },
});

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 4,
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "decimal",
  maximumFractionDigits: 2,
});

type DataItem = {
  price: number;
  amount: number;
};

function calculateCumulativePriceAndVolume(data: DataItem[]): DataItem[] {
  let cumulativePrice = 0;
  let cumulativeVolume = 0;
  return data.map((item: DataItem) => {
    cumulativeVolume += item.amount;
    return { ...item, amount: cumulativeVolume };
  });
}

export function DataGridOrderbook({
  data,
  isLoading,
  isUSD,
  isPurchase,
}: DataGridOrderbookProps) {
  const { data: auth } = useSession();
  const { data: user } = trpc.useQuery([
    "user.getUserByEmail",
    { email: auth?.user?.email as string },
  ]);

  const dynamicDecimalFormatter = (value: number, ticker: string): string => {
    const currencyDecimalMapping: { [key: string]: number } = {
      SHIB: 8,
      ELON: 10,
      FLOKI: 7,
      NFT: 9,
      PEPE: 9,
      EPX: 6,
      BONK: 8,
      WIN: 7,
      RACA: 7,
      CAPO: 6,
      SATS: 9,
    };

    const fractionDigits = currencyDecimalMapping[ticker] || 3;

    const formatter = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });

    return formatter.format(value);
  };

  const dolarValue = user?.dolarValue ?? 1;

  const columns: GridColumns = [
    {
      field: "price",
      headerName: "Preço (R$)",
      width: 200,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      flex: 1,
      headerAlign: "center", // centraliza o header
      align: "center", // centraliza as células

      valueGetter(params: GridRenderCellParams) {
        return dynamicDecimalFormatter(
          params.row.price * (isUSD ? dolarValue : 1),
          params.row.ticker
        );
      },
    },
    {
      field: "amount",
      headerName: "Volume",
      width: 150,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      flex: 1,
      headerAlign: "center", // centraliza o header
      align: "center", // centraliza as células
      valueGetter(params: GridRenderCellParams) {
        return numberFormatter.format(params.row.amount);
      },
    },
    {
      field: "total",
      headerName: "Total (R$)",
      width: 180,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      flex: 1,
      headerAlign: "center", // centraliza o header
      align: "center", // centraliza as células
      valueGetter(params: GridRenderCellParams) {
        const dolarValue = user?.dolarValue ?? 1;
        return currencyFormatter.format(
          params.row.price * (isUSD ? dolarValue : 1) * params.row.amount
        );
      },
    },
  ];

  const createRowId: GridRowIdGetter = (row) => {
    return uuidV4();
  };

  let updatedData = calculateCumulativePriceAndVolume(data).map(
    (row, index) => {
      return { ...row, index };
    }
  );

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles
        styles={{
          ".MuiDataGrid-root": {
            fontFamily: "Roboto, Arial, sans-serif",
          },
        }}
      />
      <div className={styles.tableContainer}>
        <Box className={styles.box} sx={{ height: 300, width: "100%" }}>
          {isPurchase ? (
            <DataGrid
              rows={updatedData}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              className={styles.gridCompra}
              autoPageSize
              loading={isLoading}
              getRowId={createRowId}
              hideFooterPagination
              hideFooter
              getRowClassName={(params): string => {
                return params.row.index % 2 === 0
                  ? (styles.rowColor1 as string)
                  : (styles.rowColor2 as string);
              }}
            />
          ) : (
            <DataGrid
              rows={updatedData}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              className={styles.gridVenda}
              autoPageSize
              loading={isLoading}
              getRowId={createRowId}
              hideFooterPagination
              hideFooter
              getRowClassName={(params): string => {
                return params.row.index % 2 === 0
                  ? (styles.rowColor1 as string)
                  : (styles.rowColor2 as string);
              }}
            />
          )}
        </Box>
      </div>
    </ThemeProvider>
  );
}
