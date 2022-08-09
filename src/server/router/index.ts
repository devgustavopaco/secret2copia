// src/server/router/index.ts
import { createRouter } from './context'
import superjson from 'superjson'

// import { exampleRouter } from './example'
import { authRouter } from './auth'
import { userRouter } from './user'
import { coinRouter } from './coin'
import { exchangeRouter } from './exchange'
import { taxRouter } from './tax'
import { orderbookRouter } from './orderbook'

export const appRouter = createRouter()
  .transformer(superjson)
  // .merge('example.', exampleRouter)
  .merge('auth.', authRouter)
  .merge('user.', userRouter)
  .merge('orderBook.', orderbookRouter)
  .merge('coin.', coinRouter)
  .merge('exchange.', exchangeRouter)
  .merge('tax.', taxRouter)

// export type definition of API
export type AppRouter = typeof appRouter
