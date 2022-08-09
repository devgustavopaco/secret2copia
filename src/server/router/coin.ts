import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createRouter } from './context'

export const coinRouter = createRouter()
  .query('getActiveCoins', {
    resolve({ ctx }) {
      const coins = ctx.prisma.coin.findMany({
        where: {
          active: true,
        },
      })

      return coins
    },
  })
  .query('getCoins', {
    resolve({ ctx }) {
      const coins = ctx.prisma.coin.findMany()

      return coins
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
  .mutation('create', {
    input: z.object({
      name: z.string(),
      ticker: z.string(),
      active: z.boolean(),
    }),
    async resolve({ ctx, input }) {
      const coin = await ctx.prisma.coin.create({
        data: {
          name: input.name,
          ticker: input.ticker,
          active: input.active,
        },
      })

      return coin
    },
  })
  .mutation('delete', {
    input: z.object({
      ids: z.string().cuid().array(),
    }),
    async resolve({ ctx, input }) {
      const coin = await ctx.prisma.coin.deleteMany({
        where: {
          id: {
            in: input.ids,
          },
        },
      })

      if (coin) {
        return {
          success: true,
        }
      }

      return {
        success: false,
      }
    },
  })
  .mutation('update', {
    input: z.object({
      id: z.string().cuid(),
      active: z.boolean(),
    }),
    async resolve({ ctx, input }) {
      const coin = await ctx.prisma.coin.update({
        where: {
          id: input.id,
        },
        data: {
          active: input.active,
        },
      })

      if (coin) {
        return {
          success: true,
        }
      }

      return {
        success: false,
      }
    },
  })
