
interface DolarResponse {
  USDBRL: {
    bid: string;
  }
}

export class ServerSingleton {
  private static instance: ServerSingleton

  private dolar: number

  private constructor() {
    this.dolar = 0
  }

  public static getInstance(): ServerSingleton {
    if (!ServerSingleton.instance) {
      ServerSingleton.instance = new ServerSingleton()
    }
    return ServerSingleton.instance
  }

  private async fetchDollar(): Promise<number> {

    const response = await fetch(
      `https://economia.awesomeapi.com.br/json/last/USD-BRL`
    )

    const { USDBRL } = (await response.json()) as DolarResponse

    this.dolar = Number(USDBRL.bid);

    return this.dolar
  }

  public async getDollar(): Promise<number> {
    return await this.fetchDollar()
  }

}
