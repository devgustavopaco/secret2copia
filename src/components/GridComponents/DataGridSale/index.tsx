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

export function DataGridSale() {
  const columns: GridColumns = [
    {
      field: 'preco',
      headerName: 'Preço',
      width: 150,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'volume',
      headerName: 'Volume',
      width: 150,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 150,
      editable: true,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'somaVolume',
      headerName: 'Soma Volume',
      width: 150,
      editable: true,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
  ]

  const rows = [
    {
      id: 1,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 2,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 3,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 4,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 5,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 6,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 7,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 8,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 9,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 10,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 11,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
    {
      id: 12,
      preco: 'R$ 3.3422',
      volume: '5',
      total: 'R$ 16.71',
      somaVolume: '5',
    },
  ]

  return (
    <div className={styles.tableContainer}>
      <Box className={styles.box} sx={{ height: 500 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20]}
          className={styles.grid}
          autoPageSize
        />
      </Box>
    </div>
  )
}
