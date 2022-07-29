// src/server/router/index.ts
import { createRouter } from './context'
import superjson from 'superjson'

// import { exampleRouter } from './example'
import { orderbookRouter } from './orderbook'
import { authRouter } from './auth'

export const appRouter = createRouter()
  .transformer(superjson)
  // .merge('example.', exampleRouter)
  .merge('auth.', authRouter)
  .merge('orderBook.', orderbookRouter)

// export type definition of API
export type AppRouter = typeof appRouter
