import { Box, Button } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'

import styles from './styles.module.scss'
import { useState } from 'react'
import { ModalAtivarCrypto } from '../../Modals/Cryptos/ModalAtivarCrypto'
import { ModalDesativarCrypto } from '../../Modals/Cryptos/ModalDesativarCrypto'

let ativo = false

export function DataGridCryptos() {
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
              setModalDesativarOpen(true)
            }}
          >
            Desativar
          </Button>
        )}
      </strong>
    )
  }

  const columns: GridColDef[] = [
    {
      field: 'Imagem',
      headerName: 'Imagem',
      width: 150,
      editable: true,
      sortable: false,
      renderCell: (params) => (
        <img src={params.value} className={styles.imgStyle} />
      ),
    },
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
      field: 'Ativar',
      headerName: 'Ativar / Desativar',
      width: 300,
      renderCell: renderDetailsButton,
      sortable: false,
    },
  ]

  const rows = [
    {
      id: 1,
      Imagem: '/images/Cryptos/bitcoin.png',
      Codigo: 'BRZL',
      Nome: 'Braziliex',
      Ativar: false,
    },
    {
      id: 2,
      Imagem: '/images/Cryptos/Etherium.png',
      Codigo: 'ETH',
      Nome: 'Ethereum',
      Ativar: true,
    },
    {
      id: 3,
      Imagem: '/images/Cryptos/ripple.png',
      Codigo: 'XRP',
      Nome: 'Ripple',
      Ativar: false,
    },
    {
      id: 4,
      Imagem: '/images/Cryptos/bitcoinCash.png',
      Codigo: 'BCH',
      Nome: 'Bitcoin Cash',
      Ativar: true,
    },
    {
      id: 5,
      Imagem: '/images/Cryptos/litecoin.jpeg',
      Codigo: 'LTC',
      Nome: 'Litecoin',
      Ativar: true,
    },
    {
      id: 6,
      Imagem: '/images/Cryptos/tether.png',
      Codigo: 'USDT',
      Nome: 'Tether',
      Ativar: false,
    },
    {
      id: 7,
      Imagem: '/images/Cryptos/monero.png',
      Codigo: 'XMR',
      Nome: 'Monero',
      Ativar: true,
    },
    {
      id: 8,
      Imagem: '/images/Cryptos/dash.png',
      Codigo: 'DASH',
      Nome: 'Dash',
      Ativar: false,
    },
    {
      id: 9,
      Imagem: '/images/Cryptos/bitcoin.png',
      Codigo: 'ETC',
      Nome: 'Ethereum Classic',
      Ativar: true,
    },
    {
      id: 10,
      Imagem: '/images/Cryptos/ethereumClassic.png',
      Codigo: 'BNB',
      Nome: 'Binance Coin',
      Ativar: true,
    },
    {
      id: 11,
      Imagem: '/images/Cryptos/zcash.png',
      Codigo: 'ZEC',
      Nome: 'Zcash',
      Ativar: false,
    },
    {
      id: 12,
      Imagem: '/images/Cryptos/binanceCoin.png',
      Codigo: 'OMG',
      Nome: 'OmiseGo',
      Ativar: true,
    },
  ]

  const [modalAtivarOpen, setModalAtivarOpen] = useState(false)
  const [modalDesativarOpen, setModalDesativarOpen] = useState(false)
  return (
    <>
      {modalAtivarOpen && (
        <ModalAtivarCrypto setOpenModal={setModalAtivarOpen} />
      )}
      {modalDesativarOpen && (
        <ModalDesativarCrypto setOpenModal={setModalDesativarOpen} />
      )}
      <div className={styles.cryptosList}>
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
