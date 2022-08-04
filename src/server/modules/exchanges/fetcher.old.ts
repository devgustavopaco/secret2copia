let orderbook: Exchange[] = []
const binance = (await fetch(
  `https://api.binance.com/api/v3/depth?limit=10&symbol=${COIN}`
).then((res) => res.json())) as BinanceOrderbook
orderbook.push({
  name: 'Binance',
  bid: {
    price: Number(binance.bids[0]![0]),
    amount: Number(binance.bids[0]![1]),
  },
  ask: {
    price: Number(binance.asks[0]![0]),
    amount: Number(binance.asks[0]![1]),
  },
})

const bitso = (await fetch(
  `https://api.bitso.com/v3/order_book/?book=btc_usdt`
).then((res) => res.json())) as BitsoOrderbook
orderbook.push({
  name: 'Bitso',
  bid: {
    price: Number(bitso.payload.bids[0]!.price),
    amount: Number(bitso.payload.bids[0]!.amount),
  },
  ask: {
    price: Number(bitso.payload.asks[0]!.price),
    amount: Number(bitso.payload.asks[0]!.amount),
  },
})

const brasilBitcoin = (await fetch(
  `https://brasilbitcoin.com.br/API/orderbook/BTC`
).then((res) => res.json())) as BrasilBitcoinOrderbook
orderbook.push({
  name: 'BrasilBitcoin',
  bid: {
    price: brasilBitcoin.buy[0]!.preco,
    amount: brasilBitcoin.buy[0]!.quantidade,
  },
  ask: {
    price: brasilBitcoin.sell[0]!.preco,
    amount: brasilBitcoin.sell[0]!.quantidade,
  },
})

const coinBase = (await fetch(
  `https://api.exchange.coinbase.com/products/BTC-USDT/book?level=2`
).then((res) => res.json())) as CoinBaseOrderbook
orderbook.push({
  name: 'Coinbase',
  bid: {
    price: Number(coinBase.bids[0]![0]),
    amount: Number(coinBase.bids[0]![1]),
  },
  ask: {
    price: Number(coinBase.asks[0]![0]),
    amount: Number(coinBase.asks[0]![1]),
  },
})

const chiliz = (await fetch(
  `https://api.chiliz.net/openapi/quote/v1/depth?limit=10&symbol=BTCUSDT`
).then((res) => res.json())) as ChilizOrderbook
orderbook.push({
  name: 'Chiliz',
  bid: {
    price: Number(chiliz.bids[0]![0]),
    amount: Number(chiliz.bids[0]![1]),
  },
  ask: {
    price: Number(chiliz.asks[0]![0]),
    amount: Number(chiliz.asks[0]![1]),
  },
})

const coinext = await fetch(
  `https://api.coinext.com.br:8443/AP/GetL2Snapshot`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ OMSId: 1, InstrumentId: 1, Depth: 10 }),
  }
).then((res) => res.json())

const cryptoCom = (await fetch(
  `https://api.crypto.com/v2/public/get-book?instrument_name=BTC_USDT&depth=10`
).then((res) => res.json())) as CryptoComOrderbook

const gemini = (await fetch(
  `https://api.gemini.com/v1/book/btcusd?limit_bids=10&limit_asks=10`
).then((res) => res.json())) as GeminiOrderbook

const houbi = (await fetch(
  `api-aws.huobi.pro/market/depth?symbol=btcusdt&type=step0&depth=10`
).then((res) => res.json())) as HuobiOrderbook

const kraken = (await fetch(
  `https://api.kraken.com/0/public/Depth?pair=BTCUSDT`
).then((res) => res.json())) as KrakenOrderbook

const kucoin = (await fetch(
  `https://api.kucoin.com/api/v1/market/orderbook/level2_20?symbol=BTC-USDT`
).then((res) => res.json())) as KuCoinOrderbook

const novaDAX = (await fetch(
  `https://api.novadax.com/v1/market/depth?symbol=BTC_USDT&limit=10`
).then((res) => res.json())) as NovaDAXOrderbook

const mercadoBitcoin = (await fetch(
  `https://www.mercadobitcoin.net/api/BTC/orderbook/`
).then((res) => res.json())) as MercadoBitcoinOrderbook

const hitBTC = (await fetch(
  `https://api.hitbtc.com/api/3/public/orderbook/BTCUSDT?depth=10`
).then((res) => res.json())) as HitBTCOrderbook

const bitfinex = await fetch(
  `https://api-pub.bitfinex.com/v2/book/tBTCUSD/P0?len=25`
).then((res) => res.json())

const hotBit = (await fetch(
  `https://api.hotbit.io/api/v1/order.depth?market=BTC/USDT&limit=10&interval=1e-8`
).then((res) => res.json())) as HotBitOrderbook
