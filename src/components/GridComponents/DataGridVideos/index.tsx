import { Box } from "@mui/material";
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColDef,
  GridSelectionModel,
} from "@mui/x-data-grid";
import { Videos } from "@prisma/client";
import { CheckCircle, XCircle } from "phosphor-react";
import { toast } from "react-toastify";
import { trpc } from "../../../utils/trpc";

import styles from "./styles.module.scss";
const columns: GridColDef[] = [
  {
    field: "title",
    headerName: "Titulo do video",
    width: 300,
    editable: true,
    sortable: false,
  },
  {
    field: "description",
    headerName: "Descrição do vídeo",
    width: 500,
    editable: true,
    sortable: false,
  },
  {
    field: "additionalMaterial",
    headerName: "Material complementar",
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: "idYoutube",
    headerName: "Id do Youtube",
    width: 200,
    editable: true,
    sortable: false,
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
  data: Partial<Videos>[];
  isLoading?: boolean;
  onDelete: (id: string[]) => void;
}

export function DataGridVideos({
  data,
  isLoading = false,
  onDelete,
}: DataGridUsersProps) {
  const updateMutation = trpc.useMutation("videos.update", {
    onSuccess() {
      notify("Vídeo alterado com sucesso!", true);
    },
    onError(error) {
      notify("Não foi possível realizar a operação!", false);
    },
  });

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
