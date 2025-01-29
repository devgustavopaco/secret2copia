import { ExchangeCoinTaxFuture, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
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
  .query("exchange.getById", {
    input: z.object({
      id: z.string(), // Defina o tipo apropriado para o ID
    }),
    resolve({ ctx, input }) {
      const { id } = input;

      // Consulte o banco de dados para obter os detalhes da exchange com o ID fornecido
      const exchange = ctx.prisma.exchange.findUnique({
        where: {
          id,
        },
      });

      if (!exchange) {
        throw new TRPCError({ code: "NOT_FOUND" }); // Trate o caso em que a exchange não é encontrada
      }

      return exchange;
    },
  })

  .query("getTaxes", {
    input: z.object({
      search: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      const { search } = input;
      const searchString = search ? `%${search}%` : `%`;

      const result = await ctx.prisma.$queryRaw<ExchangeCoinTaxFuture[]>(
        Prisma.sql`
        SELECT ect.id, ect.exchangeId, ect.coinId, c.name AS coinName, e.name AS exchangeName, ect.tax, ect.confirmations, ect.active, ect.createdAt, ect.updatedAt
        FROM ExchangeCoinTaxFuture AS ect
        JOIN CoinFuture AS c ON ect.coinId = c.id
        JOIN Exchange AS e ON ect.exchangeId = e.id
        WHERE c.name LIKE ${searchString}
        `
      );

      return result;
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
      const tax = await ctx.prisma.exchangeCoinTaxFuture.create({
        data: {
          exchangeId: input.exchangeId,
          coinId: input.coinId,
          tax: input.tax,
          confirmations: input.confirmations,
        },
      });

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
      const tax = await ctx.prisma.exchangeCoinTaxFuture.update({
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
        // await CoinsSingleton.getInstance().updateCoins();

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
      const tax = await ctx.prisma.exchangeCoinTaxFuture.deleteMany({
        where: {
          id: {
            in: input.ids,
          },
        },
      });

      if (tax) {
        // await CoinsSingleton.getInstance().updateCoins();

        return {
          success: true,
        };
      }

      return {
        success: false,
      };
    },
  });
