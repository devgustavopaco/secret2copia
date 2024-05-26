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
interface THBResponse {
  amount: number;
  base: string;
  date: string;
  rates: {
    THB: number;
  };
}
interface EURResponse {
  amount: number;
  base: string;
  date: string;
  rates: {
    EUR: number;
  };
}
interface IDRResponse {
  amount: number;
  base: string;
  date: string;
  rates: {
    IDR: number;
  };
}

export class ServerSingleton {
  private static instance: ServerSingleton;

  private dolar: number;
  private dolarKrw: number;
  private dolarJpy: number;
  private dolarThb: number;
  private dolarEur: number;
  private dolarIdr: number;

  private constructor() {
    this.dolar = 0;
    this.dolarKrw = 0;
    this.dolarJpy = 0;
    this.dolarThb = 0;
    this.dolarEur = 0;
    this.dolarIdr = 0;
  }

  public static getInstance(): ServerSingleton {
    if (!ServerSingleton.instance) {
      ServerSingleton.instance = new ServerSingleton();
    }
    return ServerSingleton.instance;
  }

  private async fetchDollar(): Promise<number> {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=BRL`
    );

    const data = await response.json();

    this.dolar = Number(data.rates.BRL);

    return this.dolar;
  }
  //
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
  private async fetchDollarToThb(): Promise<number> {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=THB`
    );

    const { rates } = (await response.json()) as THBResponse;

    this.dolarThb = Number(rates.THB);

    return this.dolarThb;
  }

  private async fetchDollarToEur(): Promise<number> {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=EUR`
    );

    const { rates } = (await response.json()) as EURResponse;

    this.dolarEur = Number(rates.EUR);

    return this.dolarEur;
  }

  private async fetchDollarToIdr(): Promise<number> {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=IDR`
    );

    const { rates } = (await response.json()) as IDRResponse;

    this.dolarIdr = Number(rates.IDR);

    return this.dolarIdr;
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

  public async getDollarToThb(): Promise<number> {
    return await this.fetchDollarToThb();
  }
  public async getDollarToEur(): Promise<number> {
    return await this.fetchDollarToEur();
  }
  public async getDollarToIdr(): Promise<number> {
    return await this.fetchDollarToIdr();
  }
}
