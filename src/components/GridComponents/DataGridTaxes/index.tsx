import { Box, TextField } from "@mui/material";
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColumns,
  GridSelectionModel,
  type GridRenderCellParams,
} from "@mui/x-data-grid";

import type { ExchangeCoinTax } from "@prisma/client";
import { useState } from "react";
import { trpc } from "../../../utils/trpc";
import styles from "./styles.module.scss";

interface DataGridTaxesProps {
  data: ExchangeCoinTax[];
  isLoading?: boolean;
  onSelect: (ids: string[]) => void;
  onSearch: (searchTerm: string) => void;
}

export function DataGridTaxes({
  data,
  isLoading = false,
  onSelect,
  onSearch,
}: DataGridTaxesProps) {
  const [searchText, setSearchText] = useState<string>("");
  const columns: GridColumns = [
    {
      field: "exchangeName",
      headerName: "Exchange",
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      valueGetter(params: GridRenderCellParams) {
        return params.row.exchange.name;
      },
    },
    {
      field: "coinName",
      headerName: "Moeda",
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      valueGetter(params: GridRenderCellParams) {
        return params.row.coin.name;
      },
    },
    {
      field: "tax",
      headerName: "Taxa",
      width: 200,
      editable: true,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: "confirmations",
      headerName: "Confirmações",
      width: 200,
      editable: true,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: "active",
      headerName: "Ativo",
      width: 300,
      type: "boolean",
      editable: true,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
  ];

  const updateTaxMutation = trpc.useMutation("tax.update", {
    onSuccess() {},
    onError(error) {
      console.error(error.message);
    },
  });

  const handleEditCommit = (cell: GridCellEditCommitParams) => {
    updateTaxMutation.mutate({
      id: String(cell.id),
      [cell.field]: cell.value,
    });
  };

  const handleSelectionChanged = (ids: GridSelectionModel) => {
    onSelect(ids as string[]);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    onSearch(event.target.value);
  };

  return (
    <div className={styles.tableContainer}>
      <TextField
        id="search-field"
        label="Pesquisar"
        placeholder="Pesquisar"
        value={searchText}
        onChange={handleSearchChange}
        className={styles.customTextField}
      />
      <Box className={styles.box} sx={{ height: 700 }}>
        <DataGrid
          rows={data}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20]}
          className={styles.grid}
          loading={isLoading}
          onCellEditCommit={handleEditCommit}
          checkboxSelection
          onSelectionModelChange={handleSelectionChanged}
        />
      </Box>
    </div>
  );
}
