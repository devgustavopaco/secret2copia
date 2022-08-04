import { Box } from '@mui/material'
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid'

import styles from './styles.module.scss'
const columns: GridColDef[] = [
  {
    field: 'PrimeiroNome',
    headerName: 'Primeiro Nome',
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: 'UltimoNome',
    headerName: 'Último Nome',
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: 'NomeDeUsuario',
    headerName: 'Nome de Usuário',
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: 'Telefone',
    headerName: 'Telefone',
    width: 200,
    editable: true,
    sortable: false,
  },
  {
    field: 'NomeCompleto',
    headerName: 'Nome Completo',
    width: 200,
    valueGetter: (params: GridValueGetterParams) =>
      `${params.row.PrimeiroNome || ''} ${params.row.UltimoNome || ''}`,
    sortable: false,
  },
  {
    field: 'ValorPago',
    headerName: 'Valor Pago',
    width: 200,
    editable: true,
    sortable: false,
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

export function DataGridUsers() {
  return (
    <div className={styles.userList}>
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
