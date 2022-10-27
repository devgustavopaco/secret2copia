import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { ExchangesSingleton } from '../ExchangesSingleton'
import { createRouter } from './context'

export const exchangeRouter = createRouter()
  .query('getExchanges', {
    resolve({ ctx }) {
      const exchanges = ctx.prisma.exchange.findMany()

      return exchanges
    },
  })
  .query('getActiveExchanges', {
    resolve({ ctx }) {
      const exchanges = ctx.prisma.exchange.findMany({
        where: {
          active: true,
        }
      })

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
  .mutation('create', {
    input: z.object({
      fee: z.number().nonnegative(),
      name: z.string(),
      tag: z.string(),
      image_url: z.string().url(),
      convert: z.boolean(),
    }),
    async resolve({ ctx, input }) {
      const exchange = await ctx.prisma.exchange.create({
        data: {
          fee: input.fee,
          name: input.name,
          tag: input.tag,
          convert: input.convert,
          image_url: input.image_url,
        },
      })

      if (exchange) {
        await ExchangesSingleton.getInstance().updateExchanges()

        return {
          success: true,
        }
      }

      return {
        success: false,
      }
    },
  })
  .mutation('delete', {
    input: z.object({
      ids: z.string().cuid().array(),
    }),
    async resolve({ ctx, input }) {
      const exchange = await ctx.prisma.exchange.deleteMany({
        where: {
          id: {
            in: input.ids,
          },
        },
      })

      if (exchange) {
        await ExchangesSingleton.getInstance().updateExchanges()

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
      active: z.boolean().optional(),
      fee: z.union([z.string(), z.number()]).optional(),
      name: z.string().optional(),
      tag: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      const exchange = await ctx.prisma.exchange.update({
        where: {
          id: input.id,
        },
        data: {
          active: input.active,
          fee: input.fee ? Number(input.fee) : undefined,
          name: input.name,
          tag: input.tag,
        },
      })

      if (exchange) {
        await ExchangesSingleton.getInstance().updateExchanges()

        return {
          success: true,
        }
      }

      return {
        success: false,
      }
    },
  })
