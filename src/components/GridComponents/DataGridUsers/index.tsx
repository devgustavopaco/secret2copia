import { Box, TextField } from "@mui/material";
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColDef,
  GridSelectionModel,
} from "@mui/x-data-grid";
import { User } from "@prisma/client";
import { CheckCircle, XCircle } from "phosphor-react";
import { toast } from "react-toastify";
import { trpc } from "../../../utils/trpc";

import { useState } from "react";
import styles from "./styles.module.scss";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  let day = date.getDate().toString();
  let month = (date.getMonth() + 1).toString();
  const year = date.getFullYear().toString();

  // Padding single digits with '0'
  day = day.length < 2 ? "0" + day : day;
  month = month.length < 2 ? "0" + month : month;

  return `${day}/${month}/${year}`;
}

const columns: GridColDef[] = [
  {
    field: "name",
    headerName: "Nome",
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: "email",
    headerName: "Email",
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: "phone",
    headerName: "Telefone",
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: "pricePaid",
    headerName: "Valor Pago",
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: "createdAt",
    headerName: "Data de criação",
    width: 200,
    editable: true,
    sortable: true,
    valueGetter: (params) => formatDate(params.row.createdAt),
  },
  {
    field: "bronze",
    headerName: "Bronze",
    width: 300,
    type: "boolean",
    editable: true,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
  },
  {
    field: "silver",
    headerName: "Silver",
    width: 300,
    type: "boolean",
    editable: true,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
  },
  {
    field: "gold",
    headerName: "Gold",
    width: 300,
    type: "boolean",
    editable: true,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
  },
  {
    field: "platinum",
    headerName: "Platinum",
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

interface DataGridUsersProps {
  data: Partial<User>[];
  isLoading?: boolean;
  onDelete: (id: string[]) => void;
  onSearch: (searchTerm: string) => void;
}

export function DataGridUsers({
  data,
  isLoading = false,
  onDelete,
  onSearch,
}: DataGridUsersProps) {
  const [searchText, setSearchText] = useState<string>("");
  const updateMutation = trpc.useMutation("user.update", {
    onSuccess() {
      notify("Usuário alterado com sucesso!", true);
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    onSearch(event.target.value);
  };

  const handleCommit = (e: GridCellEditCommitParams) => {
    updateMutation.mutate({
      id: String(e.id),
      [e.field]: e.value,
    });
  };

  const handleDelete = (selectionModel: GridSelectionModel) => {
    onDelete(selectionModel as string[]);
    isLoading = true;
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
          onCellEditCommit={handleCommit}
          loading={isLoading}
          getRowId={(row) => row.id}
          pageSize={20}
          rowsPerPageOptions={[20]}
          checkboxSelection
          disableSelectionOnClick
          onSelectionModelChange={handleDelete}
        />
      </Box>
    </div>
  );
}
