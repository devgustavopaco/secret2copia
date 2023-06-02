import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CoinsSingleton } from "../CoinsSingleton";
import { createRouter } from "./context";

export const taxRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    // Any queries or mutations after this middleware will
    // raise an error unless there is a current session
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .query("getTaxes", {
    input: z.object({
      search: z.string().optional(),
    }),
    resolve({ ctx, input }) {
      const { search } = input ?? {};
      const taxes = ctx.prisma.exchangeCoinTax.findMany({
        include: {
          coin: true,
          exchange: true,
        },
        where: {
          coin: {
            name: search ? {
              contains: search,
            } : undefined,
          },
        }
      });

      return taxes;
    },
  })
  .mutation("create", {
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
      });

      await CoinsSingleton.getInstance().updateCoins();

      return tax;
    },
  })
  .mutation("update", {
    input: z.object({
      id: z.string().cuid(),
      tax: z.union([z.string(), z.number()]).optional(),
      confirmations: z.union([z.string(), z.number()]).optional(),
      active: z.boolean().optional(),
    }),
    async resolve({ ctx, input }) {
      const tax = await ctx.prisma.exchangeCoinTax.update({
        where: {
          id: input.id,
        },
        data: {
          tax: input.tax ? Number(input.tax) : undefined,
          confirmations: input.confirmations
            ? Number(input.confirmations)
            : undefined,
          active: input.active,
        },
      });

      if (tax) {
        await CoinsSingleton.getInstance().updateCoins();

        return {
          success: true,
        };
      }

      return {
        success: false,
      };
    },
  })
  .mutation("delete", {
    input: z.object({
      ids: z.string().cuid().array(),
    }),
    async resolve({ ctx, input }) {
      const tax = await ctx.prisma.exchangeCoinTax.deleteMany({
        where: {
          id: {
            in: input.ids,
          },
        },
      });

      if (tax) {
        await CoinsSingleton.getInstance().updateCoins();

        return {
          success: true,
        };
      }

      return {
        success: false,
      };
    },
  });
