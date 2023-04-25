import { Box } from "@mui/material";
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColumns,
  GridSelectionModel,
  type GridRenderCellParams,
} from "@mui/x-data-grid";

import styles from "./styles.module.scss";
import type { Coin } from "@prisma/client";
import { trpc } from "../../../utils/trpc";
import { toast } from "react-toastify";
import { CheckCircle, XCircle } from "phosphor-react";

interface DataGridCryptosProps {
  data: Coin[];
  isLoading?: boolean;
  onSelect: (ids: string[]) => void;
}

export function DataGridCryptos({
  data,
  isLoading = false,
  onSelect,
}: DataGridCryptosProps) {
  const columns: GridColumns = [
    {
      field: "id",
      headerName: "Imagem",
      width: 150,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell(params: GridRenderCellParams) {
        const imageUrl = params.row.image_url;
        return (
          <img
            src={
              imageUrl ??
              `https://assets.coincap.io/assets/icons/${params.row.ticker.toLowerCase()}@2x.png`
            }
            className={styles.imgStyle}
          />
        );
      },
    },
    {
      field: "name",
      headerName: "Crypto",
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: "ticker",
      headerName: "Código",
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: "isFanToken",
      headerName: "Fan Token",
      width: 300,
      type: "boolean",
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

  const updateCryptoMutation = trpc.useMutation("coin.update", {
    onSuccess() {
      notify("Moeda alterada com sucesso!", true);
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

  const handleEditCommit = (cell: GridCellEditCommitParams) => {
    updateCryptoMutation.mutate({
      id: String(cell.id),
      [cell.field]: cell.value,
    });
  };

  const handleSelectionChanged = (ids: GridSelectionModel) => {
    onSelect(ids as string[]);
  };

  return (
    <div className={styles.tableContainer}>
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
