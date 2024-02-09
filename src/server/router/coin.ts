import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CoinsSingleton } from "../CoinsSingleton";
import { createRouter } from "./context";

export const coinRouter = createRouter()
  .query("getActiveCoins", {
    resolve({ ctx }) {
      const coins = ctx.prisma.coin.findMany({
        where: {
          active: true,
        },
      });

      return coins;
    },
  })
  .query("getCoins", {
    input: z.object({
      search: z.string().optional(),
    }),
    resolve({ ctx, input }) {
      const { search } = input ?? {};
      const coins = ctx.prisma.coin.findMany({
        where: {
          name: search
            ? {
                contains: search,
              }
            : undefined,
        },
      });
      return coins;
    },
  })
  .query("getById", {
    input: z.object({
      id: z.string().cuid(),
    }),
    async resolve({ ctx, input }) {
      const coin = await ctx.prisma.coin.findUnique({
        where: { id: input.id },
        include: {
          ExchangeCoinTax: {
            include: {
              exchange: true,
            },
          },
        },
      });

      if (!coin) {
        throw new Error("Moeda não encontrada");
      }

      return coin;
    },
  })
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("removeExchangeFromCoin", {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      const { id } = input;

      const deletedExchangeCoinTax = await ctx.prisma.exchangeCoinTax.delete({
        where: { id: id },
      });

      return deletedExchangeCoinTax;
    },
  })
  .mutation("create", {
    input: z.object({
      name: z.string(),
      ticker: z.string(),
      active: z.boolean(),
      isFanToken: z.boolean(),
      imageUrl: z.string().optional(),
      exchangeId: z.string(),
      tax: z.number(),
      confirmations: z.number(),
    }),
    async resolve({ ctx, input }) {
      try {
        console.log("Chamada para criar moeda recebida:", input);

        const coin = await ctx.prisma.coin.create({
          data: {
            name: input.name,
            ticker: input.ticker,
            active: input.active,
            isFanToken: input.isFanToken,
            image_url: input.imageUrl,
          },
        });

        console.log("Moeda criada com sucesso:", coin);

        const exchangeCoinTax = await ctx.prisma.exchangeCoinTax.create({
          data: {
            coinId: coin.id,
            exchangeId: input.exchangeId,
            tax: input.tax,
            confirmations: input.confirmations,
          },
        });

        console.log(
          "Taxa de câmbio de moeda criada com sucesso:",
          exchangeCoinTax
        );

        await CoinsSingleton.getInstance().updateCoins();

        return { coin, exchangeCoinTax };
      } catch (error) {
        console.error("Erro ao criar moeda:", error);
        throw error; // Para propagar o erro
      }
    },
  })

  .mutation("updateExchangeCoinTax", {
    input: z.object({
      id: z.string(),
      tax: z.number().min(0),
    }),
    async resolve({ ctx, input }) {
      const { id, tax } = input;

      try {
        const updatedExchangeCoinTax = await ctx.prisma.exchangeCoinTax.update({
          where: { id },
          data: { tax },
        });

        return updatedExchangeCoinTax;
      } catch (error) {
        console.error(
          "Erro ao atualizar a taxa da corretora para a moeda:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível atualizar a taxa.",
        });
      }
    },
  })

  .mutation("addExchangeToCoin", {
    input: z.object({
      coinId: z.string().cuid(),
      exchangeIds: z.array(z.string().cuid()),
      tax: z.number().min(0).optional(),
      confirmations: z.number().min(0).optional(),
    }),
    async resolve({ ctx, input }) {
      const { coinId, exchangeIds, tax = 0, confirmations = 0 } = input;
      const coinExists = await ctx.prisma.coin.findUnique({
        where: { id: coinId },
      });

      if (!coinExists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Coin not found" });
      }

      const exchangeCoinTaxes = await Promise.all(
        exchangeIds.map(async (exchangeId) => {
          const exchangeExists = await ctx.prisma.exchange.findUnique({
            where: { id: exchangeId },
          });
          if (!exchangeExists) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Exchange not found: ${exchangeId}`,
            });
          }

          return ctx.prisma.exchangeCoinTax.create({
            data: {
              coinId,
              exchangeId,
              tax,
              confirmations,
            },
          });
        })
      );

      return exchangeCoinTaxes;
    },
  })

  .mutation("delete", {
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
      });

      if (coin) {
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
  .mutation("update", {
    input: z.object({
      id: z.string().cuid(),
      active: z.boolean().optional(),
      isFanToken: z.boolean().optional(),
    }),
    async resolve({ ctx, input }) {
      const coin = await ctx.prisma.coin.update({
        where: {
          id: input.id,
        },
        data: {
          active: input.active,
          isFanToken: input.isFanToken,
        },
      });

      if (coin) {
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
