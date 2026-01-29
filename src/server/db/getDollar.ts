export async function getDollar(): Promise<number> {
  const response = await fetch(
    `https://api.frankfurter.app/latest?from=USD&to=BRL`
  );

  const data = await response.json();

  return Number(data.rates.BRL);
}
