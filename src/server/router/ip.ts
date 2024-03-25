import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter } from "./context";

export const ipRouter = createRouter()
  .query("getIPs", {
    input: z.object({
      userId: z.string().optional(),
    }),
    resolve({ ctx, input }) {
      const { userId } = input ?? {};
      return ctx.prisma.iP.findMany({
        where: {
          userId: userId
            ? {
                equals: userId,
              }
            : undefined,
        },
      });
    },
  })
  // Middleware para verificar a sessão do usuário
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  // Mutation para criar um novo IP
  .mutation("create", {
    input: z.object({
      userId: z.string(),
      ip: z.string(),
    }),
    async resolve({ ctx, input }) {
      return ctx.prisma.iP.create({
        data: {
          userId: input.userId,
          ip: input.ip,
        },
      });
    },
  })
  // Mutation para deletar um IP
  .mutation("delete", {
    input: z.object({
      id: z.string().cuid(),
    }),
    async resolve({ ctx, input }) {
      return ctx.prisma.iP.delete({
        where: {
          id: input.id,
        },
      });
    },
  })
  // Mutation para atualizar um IP
  .mutation("update", {
    input: z.object({
      id: z.string().cuid(),
      userId: z.string().optional(),
      ip: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      return ctx.prisma.iP.update({
        where: {
          id: input.id,
        },
        data: {
          userId: input.userId,
          ip: input.ip,
        },
      });
    },
  });
