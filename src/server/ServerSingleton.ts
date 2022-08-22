import dayjs from 'dayjs'

interface DolarResponse {
  '@odata.context': string
  value: {
    cotacaoCompra: number
    cotacaoVenda: number
    dataHoraCotacao: string
  }[]
}

export class ServerSingleton {
  private static instance: ServerSingleton

  private dolar: number
  private today: dayjs.Dayjs

  private constructor() {
    this.dolar = 0
    this.today = dayjs().startOf('day')
  }

  public static getInstance(): ServerSingleton {
    if (!ServerSingleton.instance) {
      ServerSingleton.instance = new ServerSingleton()
    }
    return ServerSingleton.instance
  }

  private async fetchDollar(day: dayjs.Dayjs): Promise<number> {
    console.log(`Fetching dolar for ${day.format('DD/MM/YYYY')}`)

    const formattedDate = day.startOf('day').format('MM-DD-YYYY')
    const response = await fetch(
      `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${formattedDate}'&$format=json`
    )
    const json = (await response.json()) as DolarResponse
    const todayQuote = json?.value[0]

    if (todayQuote) {
      return todayQuote.cotacaoVenda
    }
    return this.fetchDollar(day.subtract(1, 'day'))
  }

  public async getDollar(): Promise<number> {
    if (this.dolar === 0 || this.today.isBefore(dayjs().startOf('day'))) {
      this.today = dayjs().startOf('day')

      console.log(`Old price: ${this.dolar}`)
      this.dolar = await this.fetchDollar(this.today)
      console.log(`New price: ${this.dolar}`)
    }
    return this.dolar
  }

  public round(num: number, precision: number): number {
    const d = Math.pow(10, precision)
    return Math.round((num + Number.EPSILON) * d) / d
  }
}
