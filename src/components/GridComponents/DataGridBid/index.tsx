import { Box } from '@mui/material'
import {
  DataGrid,
  GridColumns,
  GridRowIdGetter,
  type GridRenderCellParams,
} from '@mui/x-data-grid'

import { v4 as uuidV4 } from 'uuid'

import styles from './styles.module.scss'

interface DataGridBidProps {
  data: { price: number; amount: number }[]
  isLoading?: boolean
  dollarPrice: number
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'decimal',
  maximumFractionDigits: 2,
})

export function DataGridBid({
  data,
  isLoading,
  dollarPrice,
}: DataGridBidProps) {
  const columns: GridColumns = [
    {
      field: 'price',
      headerName: 'Preço',
      width: 200,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      valueGetter(params: GridRenderCellParams) {
        return numberFormatter.format(params.row.price * dollarPrice)
      },
    },
    {
      field: 'amount',
      headerName: 'Volume',
      width: 200,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 250,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      valueGetter(params: GridRenderCellParams) {
        return numberFormatter.format(
          params.row.price * dollarPrice * params.row.amount
        )
      },
    },
  ]

  const createRowId: GridRowIdGetter = (row) => {
    return uuidV4()
  }

  return (
    <div className={styles.tableContainer}>
      <Box className={styles.box} sx={{ height: 500 }}>
        <DataGrid
          rows={data}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          className={styles.grid}
          autoPageSize
          loading={isLoading}
          getRowId={createRowId}
          hideFooterPagination
          hideFooter
        />
      </Box>
    </div>
  )
}
