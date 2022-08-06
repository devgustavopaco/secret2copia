import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createRouter } from './context'

export const taxRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    // Any queries or mutations after this middleware will
    // raise an error unless there is a current session
    if (!ctx.session) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next()
  })
  .query('getTaxes', {
    resolve({ ctx }) {
      const taxes = ctx.prisma.exchangeCoinTax.findMany()

      return taxes
    },
  })
  .mutation('create', {
    input: z.object({
      exchangeId: z.string(),
      coinId: z.string(),
      tax: z.number().nonnegative(),
      confirmations: z.number().int().nonnegative(),
    }),
    async resolve({ ctx, input }) {
      const tax = await ctx.prisma.exchangeCoinTax.create({
        data: {
          exchangeId: input.exchangeId,
          coinId: input.coinId,
          tax: input.tax,
          confirmations: input.confirmations,
        },
      })

      return tax
    },
  })
  .mutation('delete', {
    input: z.object({
      id: z.string().uuid(),
    }),
    async resolve({ ctx, input }) {
      const tax = await ctx.prisma.exchangeCoinTax.delete({
        where: {
          id: input.id,
        },
      })

      if (tax) {
        return {
          success: true,
        }
      }

      return {
        success: false,
      }
    },
  })
  .mutation('updateActive', {
    input: z.object({
      id: z.string().uuid(),
      active: z.boolean(),
    }),
    async resolve({ ctx, input }) {
      const tax = await ctx.prisma.exchangeCoinTax.update({
        where: {
          id: input.id,
        },
        data: {
          active: input.active,
        },
      })

      if (tax) {
        return {
          success: true,
        }
      }

      return {
        success: false,
      }
    },
  })
