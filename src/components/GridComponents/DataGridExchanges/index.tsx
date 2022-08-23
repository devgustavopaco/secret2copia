import { Box } from '@mui/material'
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColumns,
  GridSelectionModel,
} from '@mui/x-data-grid'

import styles from './styles.module.scss'

import { trpc } from '../../../utils/trpc'
import type { Exchange } from '@prisma/client'

interface DataGridExchangesProps {
  data: Exchange[]
  isLoading?: boolean
  onSelect: (ids: string[]) => void
}

export function DataGridExchanges({
  data,
  isLoading = false,
  onSelect,
}: DataGridExchangesProps) {
  const columns: GridColumns = [
    {
      field: 'name',
      headerName: 'Exchange',
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'tag',
      headerName: 'Tag',
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'fee',
      headerName: 'Taxa',
      width: 200,
      editable: true,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'convert',
      headerName: 'Converte',
      type: 'boolean',
      width: 200,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
  ]

  const updateTaxMutation = trpc.useMutation('exchange.update', {
    onSuccess() {
      console.log('success')
    },
    onError(error) {
      console.error(error.message)
    },
  })

  const handleEditCommit = (cell: GridCellEditCommitParams) => {
    updateTaxMutation.mutate({
      id: String(cell.id),
      [cell.field]: cell.value,
    })
  }

  const handleSelectionChanged = (ids: GridSelectionModel) => {
    onSelect(ids as string[])
  }

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
  )
}
