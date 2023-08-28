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
  .middleware(async ({ ctx, next }) => {
    // Any queries or mutations after this middleware will
    // raise an error unless there is a current session
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("create", {
    input: z.object({
      name: z.string(),
      ticker: z.string(),
      active: z.boolean(),
      isFanToken: z.boolean(),
      imageUrl: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      const coin = await ctx.prisma.coin.create({
        data: {
          name: input.name,
          ticker: input.ticker,
          active: input.active,
          isFanToken: input.isFanToken,
          image_url: input.imageUrl,
        },
      });

      await CoinsSingleton.getInstance().updateCoins();

      return coin;
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
