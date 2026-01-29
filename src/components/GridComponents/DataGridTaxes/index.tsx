import { Box, MenuItem, Select, TextField } from "@mui/material";
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColumns,
  GridSelectionModel,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import type { ExchangeCoinTaxFuture } from "@prisma/client";
import { CheckCircle, XCircle } from "phosphor-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { trpc } from "../../../utils/trpc";
import styles from "./styles.module.scss";

interface DataGridTaxesProps {
  data: ExchangeCoinTaxFuture[];

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
  const [exchangeOptions, setExchangeOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedExchangeName, setSelectedExchangeName] = useState("");
  const columns: GridColumns = [
    {
      field: "exchangeName",
      headerName: "Exchange",
      width: 250,
      editable: false,
      sortable: false,
      filterable: true,
      disableColumnMenu: true,
      valueGetter: (params: GridRenderCellParams<string>) =>
        params.row.exchangeName,
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
        return params.row.coinName;
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

  const updateTaxMutation = trpc.useMutation("tax.update", {
    onSuccess() {
      notify("Taxa alterada com sucesso!", true);
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

  const handleSelectionChanged = (ids: GridSelectionModel) => {
    onSelect(ids as string[]);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    onSearch(event.target.value);
  };

  const { data: exchanges, isLoading: isExchangesLoading } = trpc.useQuery([
    "exchange.getExchanges",
    { search: "" },
  ]);
  const [selectedExchange, setSelectedExchange] = useState("");

  const filteredData = selectedExchangeName
    ? data.filter((exchangeTax) => {
        const exchange = exchanges?.find(
          (e) => e.id === exchangeTax.exchangeId
        );
        return exchange ? exchange.name === selectedExchangeName : false;
      })
    : data;

  useEffect(() => {
    if (exchanges) {
      setExchangeOptions(
        exchanges.map((exchange) => ({ id: exchange.id, name: exchange.name }))
      );
    }
  }, [exchanges]);

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <TextField
          id="search-field"
          label="Pesquisar"
          placeholder="Pesquisar"
          value={searchText}
          onChange={handleSearchChange}
          className={styles.customTextField}
        />
        <Select
          value={selectedExchangeName}
          onChange={(event) => setSelectedExchangeName(event.target.value)}
          displayEmpty
          inputProps={{ "aria-label": "Without label" }}
        >
          <MenuItem value="">
            <em>Todas</em>
          </MenuItem>
          {exchangeOptions.map((exchange) => (
            <MenuItem key={exchange.id} value={exchange.name}>
              {exchange.name}
            </MenuItem>
          ))}
        </Select>
      </div>
      <Box className={styles.box} sx={{ height: 700 }}>
        <DataGrid
          rows={filteredData}
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
function notify(arg0: string, arg1: boolean) {
  throw new Error("Function not implemented.");
}
