import { Box } from '@mui/material'
import {
  DataGrid,
  GridCellEditCommitParams,
  GridColumns,
  GridSelectionModel,
  type GridRenderCellParams,
} from '@mui/x-data-grid'

import styles from './styles.module.scss'
import { useState } from 'react'
import type { ExchangeCoinTax } from '@prisma/client'
import { trpc } from '../../../utils/trpc'

interface DataGridTaxesProps {
  data: ExchangeCoinTax[]
  isLoading?: boolean
  onSelect: (ids: string[]) => void
}

export function DataGridTaxes({
  data,
  isLoading = false,
  onSelect,
}: DataGridTaxesProps) {
  const columns: GridColumns = [
    {
      field: 'exchangeName',
      headerName: 'Exchange',
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      valueGetter(params: GridRenderCellParams) {
        return params.row.exchange.name
      },
    },
    {
      field: 'coinName',
      headerName: 'Moeda',
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      valueGetter(params: GridRenderCellParams) {
        return params.row.coin.name
      },
    },
    {
      field: 'tax',
      headerName: 'Taxa',
      width: 200,
      editable: true,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'confirmations',
      headerName: 'Confirmações',
      width: 200,
      editable: true,
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

  const [selectedIds, setSelectedIds] = useState<string[]>([])

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
