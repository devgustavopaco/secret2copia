import { Box, TextField } from "@mui/material";
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColumns,
  GridSelectionModel,
} from "@mui/x-data-grid";

import styles from "./styles.module.scss";

import type { Exchange } from "@prisma/client";
import { CheckCircle, XCircle } from "phosphor-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { trpc } from "../../../utils/trpc";

interface DataGridExchangesProps {
  data: Exchange[];
  isLoading?: boolean;
  onSelect: (ids: string[]) => void;
  onSearch: (searchTerm: string) => void;
}

export function DataGridExchanges({
  data,
  isLoading = false,
  onSelect,
  onSearch,
}: DataGridExchangesProps) {
  const [searchText, setSearchText] = useState<string>("");
  const columns: GridColumns = [
    {
      field: "name",
      headerName: "Exchange",
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: "tag",
      headerName: "Tag",
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: "fee",
      headerName: "Taxa",
      width: 200,
      editable: true,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: "convert",
      headerName: "Converte",
      type: "boolean",
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

  const notify = (text: string, success: boolean) => {
    if (success) {
      toast.dark(text, {
        icon: <CheckCircle size={32} color="#07bc0c" weight="fill" />,
      });
    } else {
      toast.dark(text, {
        icon: <XCircle size={32} color="#ff3838" weight="fill" />,
      });
    }
  };

  const updateTaxMutation = trpc.useMutation("exchange.update", {
    onSuccess() {
      notify("Exchange alterada com sucesso!", true);
      localStorage.clear();
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const handleEditCommit = (cell: GridCellEditCommitParams) => {
    updateTaxMutation.mutate({
      id: String(cell.id),
      [cell.field]: cell.value,
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    onSearch(event.target.value);
  };

  const handleSelectionChanged = (ids: GridSelectionModel) => {
    onSelect(ids as string[]);
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
