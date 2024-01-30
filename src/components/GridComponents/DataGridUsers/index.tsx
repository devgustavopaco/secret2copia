import { Box, TextField, createTheme } from "@mui/material";
import { GridFilterModel } from "@mui/x-data-grid";
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColDef,
  GridSelectionModel,
} from "@mui/x-data-grid";
import { User } from "@prisma/client";
import { Select, MenuItem } from "@mui/material";
import { CheckCircle, XCircle } from "phosphor-react";
import { toast } from "react-toastify";
import { trpc } from "../../../utils/trpc";

import { useState } from "react";
import styles from "./styles.module.scss";
import { Mode } from "@mui/icons-material";

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
    width: 400,
    editable: true,
    sortable: false,
  },
  {
    field: "accessLevel",
    filterable: true,
    headerName: "Nível de Acesso",
    width: 400,
    sortable: false,
    valueGetter: (params) => getAccessLevel(params.row),
    renderCell: (params) => {
      const level = getAccessLevel(params.row);
      const levelColor = {
        Bronze: "bronzeColor",
        Silver: "silverColor",
        Gold: "goldColor",
        Platinum: "platinumColor",
        Nenhum: "noneColor",
      };
      return (
        <span
          className={`${styles[levelColor[level]]} ${styles.accessLevelCell}`}
        >
          {level}
        </span>
      );
    },
  },
  {
    field: "email",
    headerName: "Email",
    width: 300,
    editable: true,
    sortable: false,
  },
  {
    field: "phone",
    headerName: "Telefone",
    width: 250,
    editable: true,
    sortable: false,
  },
  {
    field: "pricePaid",
    headerName: "Valor Pago",
    width: 250,
    editable: true,
    sortable: false,
  },
  {
    field: "createdAt",
    headerName: "Data de criação",
    width: 250,
    editable: true,
    sortable: true,
    valueGetter: (params) => formatDate(params.row.createdAt),
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

function getAccessLevel(user: {
  platinum: string;
  gold: string;
  silver: string;
  bronze: string;
}) {
  if (user.platinum) {
    return "Platinum";
  } else if (user.gold) {
    return "Gold";
  } else if (user.silver) {
    return "Silver";
  } else if (user.bronze) {
    return "Bronze";
  } else {
    return "Nenhum";
  }
}

export function DataGridUsers({
  data,
  isLoading = false,
  onDelete,
  onSearch,
}: DataGridUsersProps) {
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });
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
      <div className={styles.filter}>
        <Select
          value={filterModel.items[0]?.value || ""}
          onChange={(e) => {
            const value = e.target.value;
            setFilterModel({
              items: value
                ? [
                    {
                      columnField: "accessLevel",
                      operatorValue: "equals",
                      value,
                    },
                  ]
                : [],
            });
          }}
          displayEmpty
          inputProps={{ "aria-label": "Without label" }}
        >
          <MenuItem value="">
            <em>Nenhum</em>
          </MenuItem>
          <MenuItem value="Bronze">Bronze</MenuItem>
          <MenuItem value="Silver">Silver</MenuItem>
          <MenuItem value="Gold">Gold</MenuItem>
          <MenuItem value="Platinum">Platinum</MenuItem>
        </Select>
        <TextField
          id="search-field"
          label="Pesquisar"
          placeholder="Pesquisar"
          value={searchText}
          onChange={handleSearchChange}
          className={styles.customTextField}
        />
      </div>
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
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
        />
      </Box>
    </div>
  );
}
