import { Box } from "@mui/material";
import {
  DataGrid,
  GridColumns,
  GridRowIdGetter,
  type GridRenderCellParams,
} from "@mui/x-data-grid";

import { GlobalStyles, ThemeProvider, createTheme } from "@mui/material";
import { v4 as uuidV4 } from "uuid";

import styles from "./styles.module.scss";

interface DataGridOrderbookProps {
  data: { price: number; amount: number }[];
  isLoading?: boolean;
  dollarPrice: number;
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
    cumulativePrice += item.price;
    cumulativeVolume += item.amount;
    return { ...item, price: cumulativePrice, amount: cumulativeVolume };
  });
}

export function DataGridOrderbook({
  data,
  isLoading,
  dollarPrice,
  isUSD,
  isPurchase,
}: DataGridOrderbookProps) {
  const columns: GridColumns = [
    {
      field: "price",
      headerName: "Preço",
      width: 200,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      flex: 1,
      headerAlign: "center", // centraliza o header
      align: "center", // centraliza as células

      valueGetter(params: GridRenderCellParams) {
        return priceFormatter.format(
          params.row.price * (isUSD ? dollarPrice : 1)
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
      headerName: "Total",
      width: 180,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      flex: 1,
      headerAlign: "center", // centraliza o header
      align: "center", // centraliza as células
      valueGetter(params: GridRenderCellParams) {
        return currencyFormatter.format(
          params.row.price * (isUSD ? dollarPrice : 1) * params.row.amount
        );
      },
    },
  ];

  const createRowId: GridRowIdGetter = (row) => {
    return uuidV4();
  };

  let updatedData = calculateCumulativePriceAndVolume(data);

  console.log(data);
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
        <Box className={styles.box} sx={{ height: 500, width: "100%" }}>
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
            />
          )}
        </Box>
      </div>
    </ThemeProvider>
  );
}
