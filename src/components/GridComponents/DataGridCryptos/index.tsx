import { Box } from '@mui/material'
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColumns,
  GridSelectionModel,
  type GridRenderCellParams,
} from '@mui/x-data-grid'

import styles from './styles.module.scss'
import type { Coin } from '@prisma/client'
import { trpc } from '../../../utils/trpc'

interface DataGridCryptosProps {
  data: Coin[]
  isLoading?: boolean
  onSelect: (ids: string[]) => void
}

export function DataGridCryptos({
  data,
  isLoading = false,
  onSelect,
}: DataGridCryptosProps) {
  const columns: GridColumns = [
    {
      field: 'id',
      headerName: 'Imagem',
      width: 150,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell(params: GridRenderCellParams) {
        return (
          <img
            src={`https://assets.coincap.io/assets/icons/${params.row.ticker.toLowerCase()}@2x.png`}
            className={styles.imgStyle}
          />
        )
      },
    },
    {
      field: 'name',
      headerName: 'Crypto',
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'ticker',
      headerName: 'Código',
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'active',
      headerName: 'Ativo',
      width: 300,
      type: 'boolean',
      editable: true,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
  ]

  const updateTaxMutation = trpc.useMutation('tax.update', {
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
