import { Box } from '@mui/material'
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColDef,
  GridSelectionModel,
} from '@mui/x-data-grid'
import { User } from '@prisma/client'
import { trpc } from '../../../utils/trpc'

import styles from './styles.module.scss'
const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: 'phone',
    headerName: 'Telefone',
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: 'pricePaid',
    headerName: 'Valor Pago',
    width: 200,
    editable: true,
    sortable: false,
  },
]

interface DataGridUsersProps {
  data: Partial<User>[]
  isLoading?: boolean
  onDelete: (id: string[]) => void
}

export function DataGridUsers({
  data,
  isLoading = false,
  onDelete,
}: DataGridUsersProps) {
  const updateMutation = trpc.useMutation('user.update', {
    onSuccess() {
      console.log('success')
    },
    onError(error) {
      console.error(error.message)
    },
  })

  const handleCommit = (e: GridCellEditCommitParams) => {
    updateMutation.mutate({
      id: String(e.id),
      [e.field]: e.value,
    })
  }

  const handleDelete = (selectionModel: GridSelectionModel) => {
    onDelete(selectionModel as string[])
    isLoading = true
  }

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
  )
}
