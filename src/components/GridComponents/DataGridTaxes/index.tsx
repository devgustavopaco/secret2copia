import { Box, Button } from '@mui/material'
import {
  DataGrid,
  GridColumns,
  type GridRenderCellParams,
} from '@mui/x-data-grid'

import styles from './styles.module.scss'
import { useState } from 'react'
import type { ExchangeCoinTax } from '@prisma/client'
import { ThumbsDown, ThumbsUp } from 'phosphor-react'
import { ModalActivateTaxes } from '../../Modals/Taxes/ModalActivateTaxes'
import { ModalDeactivateTaxes } from '../../Modals/Taxes/ModalDeactivateTaxes'

interface DetailsButtonProps {
  isActive: boolean
  onClick: () => void
}

const DetailsButton = ({ isActive, onClick }: DetailsButtonProps) => {
  return (
    <Button
      className={styles.BtnAtivar}
      variant="outlined"
      startIcon={
        isActive ? <ThumbsDown weight="bold" /> : <ThumbsUp weight="bold" />
      }
      onClick={onClick}
    >
      {isActive ? 'Desativar' : 'Ativar'}
    </Button>
  )
}

interface DataGridTaxesProps {
  data: ExchangeCoinTax[]
  isLoading?: boolean
}

export function DataGridTaxes({ data, isLoading = false }: DataGridTaxesProps) {
  const [modalAtivarOpen, setModalAtivarOpen] = useState(false)
  const [modalDesativarOpen, setModalDesativarOpen] = useState(false)

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
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'confirmations',
      headerName: 'Confirmações',
      width: 200,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
    {
      field: 'Ativar',
      headerName: 'Ativar / Desativar',
      width: 300,
      renderCell: ({ row }: GridRenderCellParams<any, ExchangeCoinTax>) => (
        <DetailsButton
          isActive={row.active}
          onClick={() => {
            if (row.active) {
              setModalDesativarOpen(true)
            } else {
              setModalAtivarOpen(true)
            }
          }}
        />
      ),
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
  ]

  return (
    <>
      {modalAtivarOpen && <ModalActivateTaxes onToggle={setModalAtivarOpen} />}
      {modalDesativarOpen && (
        <ModalDeactivateTaxes setOpenModal={setModalDesativarOpen} />
      )}
      <div className={styles.tableContainer}>
        <Box className={styles.box} sx={{ height: 700 }}>
          <DataGrid
            rows={data}
            columns={columns}
            pageSize={20}
            rowsPerPageOptions={[20]}
            className={styles.grid}
            loading={isLoading}
          />
        </Box>
      </div>
    </>
  )
}
