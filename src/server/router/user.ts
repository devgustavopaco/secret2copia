import { TRPCError } from "@trpc/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { createRouter } from "./context";

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
      search: z.string().optional(),
    }),
    resolve({ ctx, input }) {
      const { search } = input ?? {};
      const allUsers = ctx.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          pricePaid: true,
          phone: true,
          dolarValue: true,
        },
        where: {
          email: {
            not: "admin@solid.dev.br",
          },
          name: search
            ? {
                contains: search,
              }
            : undefined,
        },
      });

      return allUsers;
    },
  })

  .query("getUserByEmail", {
    input: z.object({
      email: z.string(),
    }),
    async resolve({ ctx, input }) {
      const user = ctx.prisma.user.findUnique({
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
      console.log("ID do usuário recebido: ", input.id); // Log do ID do usuário recebido

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
