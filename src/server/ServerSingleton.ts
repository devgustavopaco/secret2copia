interface DolarResponse {
  USDBRL: {
    bid: string;
  };
}

interface KRWResponse {
  amount: number;
  base: string;
  date: string;
  rates: {
    KRW: number;
  };
}
interface JPYResponse {
  amount: number;
  base: string;
  date: string;
  rates: {
    JPY: number;
  };
}

export class ServerSingleton {
  private static instance: ServerSingleton;

  private dolar: number;
  private dolarKrw: number;
  private dolarJpy: number;

  private constructor() {
    this.dolar = 0;
    this.dolarKrw = 0;
    this.dolarJpy = 0;
  }

  public static getInstance(): ServerSingleton {
    if (!ServerSingleton.instance) {
      ServerSingleton.instance = new ServerSingleton();
    }
    return ServerSingleton.instance;
  }

  private async fetchDollar(): Promise<number> {
    const response = await fetch(
      `https://economia.awesomeapi.com.br/json/last/USD-BRL`
    );

    const { USDBRL } = (await response.json()) as DolarResponse;

    this.dolar = Number(USDBRL.bid);

    return this.dolar;
  }

  private async fetchDollarToKrw(): Promise<number> {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=KRW`
    );

    const { rates } = (await response.json()) as KRWResponse;

    this.dolarKrw = Number(rates.KRW);

    return this.dolarKrw;
  }

  private async fetchDollarToJpy(): Promise<number> {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=JPY`
    );

    const { rates } = (await response.json()) as JPYResponse;

    this.dolarJpy = Number(rates.JPY);

    return this.dolarJpy;
  }


  public async getDollar(): Promise<number> {
    return await this.fetchDollar();
  }

  public async getDollarToKrw(): Promise<number> {
    return await this.fetchDollarToKrw();
  }

  public async getDollarToJpy(): Promise<number> {
    return await this.fetchDollarToJpy();
  }
}
