import { Box, MenuItem, Select, TextField } from "@mui/material";
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColumns,
  GridFilterItem,
  GridFilterModel,
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

export function DataGridExchanges({
  data,
  isLoading = false,
  onSelect,
  onSearch,
}: DataGridExchangesProps) {
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });
  const [convertFilter, setConvertFilter] = useState("");
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
      filterable: true,
      editable: true,
      sortable: false,

      disableColumnMenu: true,
      renderCell: (params) => {
        return params.value ? (
          <div className={`${styles.convertTrue}`}>Converte</div>
        ) : (
          <div className={`${styles.convertFalse}`}>Não Converte</div>
        );
      },
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

  const handleConvertFilterChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    setConvertFilter(value);

    let newFilterItems: {
      columnField: string;
      operatorValue: string;
      value: boolean;
    }[] = [];
    if (value === "yes") {
      newFilterItems = [
        {
          columnField: "convert",
          operatorValue: "is",
          value: true,
        },
      ];
    } else if (value === "no") {
      newFilterItems = [
        {
          columnField: "convert",
          operatorValue: "is",
          value: false,
        },
      ];
    }

    setFilterModel({
      items: newFilterItems,
    });
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
          pageSize={20}
          rowsPerPageOptions={[20]}
          className={styles.grid}
          loading={isLoading}
          onCellEditCommit={handleEditCommit}
          checkboxSelection
          onSelectionModelChange={handleSelectionChanged}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
        />
      </Box>
    </div>
  );
}
