import { Box } from '@mui/material'
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid'
import { UserCirclePlus } from 'phosphor-react'
import { Trash } from 'phosphor-react'
import { useState } from 'react'
import { DeleteModal } from '../Modal/DeleteModal'

import styles from './styles.module.scss'
const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  {
    field: 'PrimeiroNome',
    headerName: 'Primeiro Nome',
    width: 200,
    editable: true,
  },
  {
    field: 'UltimoNome',
    headerName: 'Último Nome',
    width: 200,
    editable: true,
  },
  {
    field: 'NomeDeUsuario',
    headerName: 'Nome de Usuário',
    width: 200,
    editable: true,
  },
  {
    field: 'Telefone',
    headerName: 'Telefone',
    width: 200,
    editable: true,
  },
  {
    field: 'NomeCompleto',
    headerName: 'Nome Completo',
    width: 200,
    valueGetter: (params: GridValueGetterParams) =>
      `${params.row.PrimeiroNome || ''} ${params.row.UltimoNome || ''}`,
  },
  {
    field: 'ValorPago',
    headerName: 'Valor Pago',
    width: 200,
    editable: true,
  },
]

const rows = [
  {
    id: 1,
    UltimoNome: 'Snow',
    PrimeiroNome: 'Jon',
    NomeDeUsuario: 'neptuneanimaltracks',
    Telefone: '(69) 2413-6243',
    ValorPago: '1.600,00',
  },
  {
    id: 2,
    UltimoNome: 'Lannister',
    PrimeiroNome: 'Cersei',
    NomeDeUsuario: 'volleyballbagelpolar',
    Telefone: '(51) 3322-6564',
    ValorPago: '1.600,00',
  },
  {
    id: 3,
    UltimoNome: 'Lannister',
    PrimeiroNome: 'Jaime',
    NomeDeUsuario: 'batmanbeginsfigcane',
    Telefone: '(65) 2454-7780',
    ValorPago: '1.600,00',
  },
  {
    id: 4,
    UltimoNome: 'Stark',
    PrimeiroNome: 'Arya',
    NomeDeUsuario: 'mandolincricketrye',
    Telefone: '(86) 3136-0620',
    ValorPago: '1.600,00',
  },
  {
    id: 5,
    UltimoNome: 'Targaryen',
    PrimeiroNome: 'Daenerys',
    NomeDeUsuario: 'deepimpactpsychooboe',
    Telefone: '(48) 2343-7692',
    ValorPago: '1.600,00',
  },
  {
    id: 6,
    UltimoNome: 'Melisandre',
    PrimeiroNome: 'Herbert',
    NomeDeUsuario: 'rushwhiskeycheetah',
    Telefone: '(68) 3210-6345',
    ValorPago: '1.600,00',
  },
  {
    id: 7,
    UltimoNome: 'Clifford',
    PrimeiroNome: 'Ferrara',
    NomeDeUsuario: 'flowerlightningnet',
    Telefone: '(65) 2477-9481',
    ValorPago: '1.600,00',
  },
  {
    id: 8,
    UltimoNome: 'Frances',
    PrimeiroNome: 'Rossini',
    NomeDeUsuario: 'tabletennisprisoners',
    Telefone: '(49) 3854-2685',
    ValorPago: '1.600,00',
  },
  {
    id: 9,
    UltimoNome: 'Roxie',
    PrimeiroNome: 'Harvey',
    NomeDeUsuario: 'oportunityturtledog',
    Telefone: '(66) 2621-9717',
    ValorPago: '1.600,00',
  },
  {
    id: 10,
    UltimoNome: 'Roxie',
    PrimeiroNome: 'Harvey',
    NomeDeUsuario: 'oportunityturtledog',
    Telefone: '(66) 2621-9717',
    ValorPago: '1.600,00',
  },
  {
    id: 11,
    UltimoNome: 'Roxie',
    PrimeiroNome: 'Harvey',
    NomeDeUsuario: 'oportunityturtledog',
    Telefone: '(66) 2621-9717',
    ValorPago: '1.600,00',
  },
  {
    id: 12,
    UltimoNome: 'Roxie',
    PrimeiroNome: 'Harvey',
    NomeDeUsuario: 'oportunityturtledog',
    Telefone: '(66) 2621-9717',
    ValorPago: '1.600,00',
  },
]

export function DataGridComponent() {
  const [openModal, setOpenModal] = useState(false)

  return (
    <div className={styles.userList}>
      <div className={styles.buttonList}>
        <button type="button" className={styles.addButton}>
          Adicionar
          <UserCirclePlus size={24} />
        </button>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => {
            setOpenModal(true)
          }}
        >
          Excluir
          <Trash size={24} />
        </button>
        {openModal && <DeleteModal closeModal={setOpenModal} />}
      </div>

      <Box className={styles.box} sx={{ height: 700, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20]}
          checkboxSelection
          disableSelectionOnClick
          className={styles.grid}
        />
      </Box>
    </div>
  )
}
