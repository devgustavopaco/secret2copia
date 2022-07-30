// src/server/router/index.ts
import { createRouter } from './context'
import superjson from 'superjson'

// import { exampleRouter } from './example'
import { authRouter } from './auth'
import { coinRouter } from './coin'
import { orderbookRouter } from './orderbook'

export const appRouter = createRouter()
  .transformer(superjson)
  // .merge('example.', exampleRouter)
  .merge('auth.', authRouter)
  .merge('orderBook.', orderbookRouter)
  .merge('coin.', coinRouter)

// export type definition of API
export type AppRouter = typeof appRouter
