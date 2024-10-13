import { TRPCError } from "@trpc/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { createRouter } from "./context";

interface UserWhereInput {
  email?: { not: string };
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  name?: {
    contains?: string;
  };
}

export async function getDollarValueForUser(ctx: any, email: string) {
  const user = await ctx.prisma.user.findUnique({
    where: { email },
    select: { dolarValue: true },
  });

  return user?.dolarValue ?? 1;
}

export const userRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    // Any queries or mutations after this middleware will
    // raise an error unless there is a current session
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .query("getAllUsers", {
    input: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      search: z.string().optional(),
    }),
    resolve({ ctx, input }) {
      // Definindo 'where' com o tipo específico
      let where: UserWhereInput = {
        email: {
          not: "admin@solid.dev.br",
        },
      };

      // Adicionando condições de filtro
      if (input.startDate && input.endDate) {
        where.createdAt = {
          gte: new Date(input.startDate),
          lte: new Date(input.endDate),
        };
      }

      if (input.search) {
        where.name = {
          contains: input.search,
        };
      }

      // Consulta ao banco de dados
      const allUsers = ctx.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          pricePaid: true,
          phone: true,
          dolarValue: true,
          bronze: true,
          silver: true,
          gold: true,
          platinum: true,
          createdAt: true,
        },
        where,
      });

      return allUsers;
    },
  })

  .query("getAllUsersByDateRanges", {
    input: z.object({
      dateRanges: z.array(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      ),
    }),
    async resolve({ ctx, input }) {
      const userCountsByDateRange = await Promise.all(
        input.dateRanges.map(async (range) => {
          const count = await ctx.prisma.user.count({
            where: {
              createdAt: {
                gte: new Date(range.startDate),
                lte: new Date(range.endDate),
              },
              email: {
                not: "admin@solid.dev.br",
              },
            },
          });
          return count;
        })
      );

      return userCountsByDateRange;
    },
  })

  .query("getUserByEmail", {
    input: z.object({
      email: z.string(),
    }),
    async resolve({ ctx, input }) {
      const user = ctx.prisma.user.findUnique({
        select: {
          id: true,
          email: true,
          bronze: true,
          silver: true,
          gold: true,
          platinum: true,
          image: true,
          dolarValue: true,
          roleId: true,
        },
        where: {
          email: input.email,
        },
      });
      return user;
    },
  })
  .query("getUserDollarValueByEmail", {
    input: z.object({
      email: z.string(),
    }),
    async resolve({ ctx, input }) {
      return getDollarValueForUser(ctx, input.email);
    },
  })
  .query("getUserDollarValueById", {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      console.log("ID do usuário recebido: ", input.id);

      const user = await ctx.prisma.user.findUnique({
        where: {
          id: input.id,
        },
        select: {
          dolarValue: true,
        },
      });

      console.log("Usuário encontrado: ", user); // Log do usuário encontrado

      return user ? user.dolarValue : null;
    },
  })

  .mutation("create", {
    input: z.object({
      name: z.string(),
      email: z.string(),
      pricePaid: z.number(),
      phone: z.string(),
      password: z.string(),
      dolarValue: z.number(),
      imageUrl: z.string().optional(),
      bronze: z.boolean(),
      silver: z.boolean(),
      gold: z.boolean(),
      platinum: z.boolean(),
      ip: z.string(),
    }),
    async resolve({ ctx, input }) {
      const userRole = await ctx.prisma.role.findFirst({
        where: {
          name: "user",
        },
      });

      const passwordHash = await hash(input.password, 8);
      const user = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          pricePaid: input.pricePaid,
          phone: input.phone,
          password: passwordHash,
          dolarValue: input.dolarValue,
          roleId: userRole!.id,
          image: input.imageUrl,
          bronze: input.bronze ? 1 : 0,
          silver: input.silver ? 1 : 0,
          gold: input.gold ? 1 : 0,
          platinum: input.platinum ? 1 : 0,
        },
      });

      return user;
    },
  })
  .mutation("update", {
    input: z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      pricePaid: z.union([z.string(), z.number()]).optional(),
      phone: z.string().optional(),
      dolarValue: z.number().optional(),
      bronze: z.boolean().optional(),
      silver: z.boolean().optional(),
      gold: z.boolean().optional(),
      platinum: z.boolean().optional(),
    }),
    async resolve({ ctx, input }) {
      const user = await ctx.prisma.user.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          email: input.email,
          pricePaid: input.pricePaid ? Number(input.pricePaid) : undefined,
          phone: input.phone,
          dolarValue: input.dolarValue,
          bronze: input.bronze ? 1 : 0,
          silver: input.silver ? 1 : 0,
          gold: input.gold ? 1 : 0,
          platinum: input.platinum ? 1 : 0,
        },
      });

      return user;
    },
  })
  .mutation("updatePassword", {
    input: z.object({
      id: z.string(),
      password: z.string(),
    }),
    async resolve({ ctx, input }) {
      const passwordHash = await hash(input.password, 8);
      const user = await ctx.prisma.user.update({
        where: {
          id: input.id,
        },
        data: {
          password: passwordHash,
        },
      });

      return user;
    },
  })
  .mutation("delete", {
    input: z.object({
      ids: z.string().array(),
    }),
    async resolve({ ctx, input }) {
      const user = await ctx.prisma.user.deleteMany({
        where: {
          id: {
            in: input.ids,
          },
        },
      });

      if (user) {
        return {
          success: true,
        };
      }

      return {
        success: false,
      };
    },
  })
  .mutation("updateUserDollarValue", {
    input: z.object({
      id: z.string(),
      dolarValue: z.number(),
    }),
    async resolve({ ctx, input }) {
      const user = await ctx.prisma.user.update({
        where: {
          id: input.id,
        },
        data: {
          dolarValue: input.dolarValue,
        },
      });

      return user;
    },
  });
