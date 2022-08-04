import { Box, Button } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'

import styles from './styles.module.scss'
import { useState } from 'react'
import { ModalAtivarExchange } from '../../Modals/Exchange/ModalAtivarExchange'
import { ModalInativarExchange } from '../../Modals/Exchange/ModalInativarExchange'

let ativo = false

export function DataGridExchanges() {
  const renderDetailsButton = (params: any) => {
    if (params.row.Ativar === false) {
      ativo = false
    } else {
      ativo = true
    }

    return (
      <strong>
        {ativo ? (
          <Button
            className={styles.BtnAtivar}
            variant="outlined"
            startIcon={<ThumbUpAltOutlinedIcon />}
            onClick={() => {
              setModalAtivarOpen(true)
            }}
          >
            Ativar
          </Button>
        ) : (
          <Button
            className={styles.BtnAtivar}
            variant="outlined"
            startIcon={<ThumbDownAltOutlinedIcon />}
            onClick={() => {
              setModalInativarOpen(true)
            }}
          >
            Inativar
          </Button>
        )}
      </strong>
    )
  }

  const columns: GridColDef[] = [
    {
      field: 'Codigo',
      headerName: 'Código',
      width: 400,
      editable: false,
      sortable: false,
    },
    {
      field: 'Nome',
      headerName: 'Nome',
      width: 400,
      editable: false,
      sortable: false,
    },
    {
      field: 'Taxa',
      headerName: 'Taxa',
      width: 300,
      editable: true,
      sortable: false,
    },
    {
      field: 'Ativar',
      headerName: 'Ativar / Inativar',
      width: 300,
      renderCell: renderDetailsButton,
      sortable: false,
    },
  ]

  const rows = [
    {
      id: 1,
      Codigo: 'BRZL',
      Nome: 'Braziliex',
      Taxa: '0.5',
      Ativar: false,
    },
    {
      id: 2,
      Codigo: 'BNB',
      Nome: 'Binance',
      Taxa: '0.1',
      Ativar: false,
    },
    {
      id: 3,
      Codigo: 'MBT',
      Nome: 'Mercado Bitcoin',
      Taxa: '0.7',
      Ativar: true,
    },
    {
      id: 4,
      Codigo: 'HBT',
      Nome: 'HitBTC',
      Taxa: '	0.1',
      Ativar: true,
    },
    {
      id: 5,
      Codigo: 'BTT',
      Nome: 'BitcoinTrade',
      Taxa: '0.5',
      Ativar: false,
    },
    {
      id: 6,
      Codigo: 'NVD',
      Nome: 'NovaDAX',
      Taxa: '	0.5',
      Ativar: true,
    },
    {
      id: 7,
      Codigo: 'BTY',
      Nome: 'Bitcointoyou',
      Taxa: '0.5',
      Ativar: false,
    },
    {
      id: 8,
      Codigo: 'BFN',
      Nome: 'Bitfinex',
      Taxa: '	0.1',
      Ativar: true,
    },
    {
      id: 9,
      Codigo: 'HBG',
      Nome: 'Huobi Global',
      Taxa: '0.2',
      Ativar: false,
    },
    {
      id: 10,
      Codigo: 'HOT',
      Nome: 'Hotbit',
      Taxa: '0.2',
      Ativar: true,
    },
    {
      id: 11,
      Codigo: 'CHZ',
      Nome: 'Chiliz',
      Taxa: '0.6',
      Ativar: false,
    },
    {
      id: 12,
      Codigo: 'KCS',
      Nome: 'Kucoin',
      Taxa: '0.1',
      Ativar: true,
    },
  ]

  const [modalAtivarOpen, setModalAtivarOpen] = useState(false)
  const [modalInativarOpen, setModalInativarOpen] = useState(false)
  return (
    <>
      {modalAtivarOpen && (
        <ModalAtivarExchange setOpenModal={setModalAtivarOpen} />
      )}
      {modalInativarOpen && (
        <ModalInativarExchange setOpenModal={setModalInativarOpen} />
      )}
      <div className={styles.exchangeList}>
        <Box className={styles.box} sx={{ height: 700 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={20}
            rowsPerPageOptions={[20]}
            className={styles.grid}
          />
        </Box>
      </div>
    </>
  )
}
