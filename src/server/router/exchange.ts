import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createRouter } from './context'

export const exchangeRouter = createRouter()
  // .query('getActiveExchanges', {
  //   resolve({ ctx }) {
  //     const exchanges = ctx.prisma.exchange.findMany({
  //       where: {

  //       },
  //     })

  //     return exchanges
  //   },
  // })
  .query('getExchanges', {
    resolve({ ctx }) {
      const exchanges = ctx.prisma.exchange.findMany()

      return exchanges
    },
  })
  .middleware(async ({ ctx, next }) => {
    // Any queries or mutations after this middleware will
    // raise an error unless there is a current session
    if (!ctx.session) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next()
  })
  .mutation('updateFee', {
    input: z.object({
      id: z.string().uuid(),
      fee: z.number().nonnegative(),
    }),
    async resolve({ ctx, input }) {
      const exchange = await ctx.prisma.exchange.update({
        where: {
          id: input.id,
        },
        data: {
          fee: input.fee,
        },
      })

      if (exchange) {
        return {
          success: true,
        }
      }

      return {
        success: false,
      }
    },
  })
