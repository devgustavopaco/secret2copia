import { TRPCError } from "@trpc/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { createRouter } from "./context";

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
    resolve({ ctx }) {
      const allUsers = ctx.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          pricePaid: true,
          phone: true,
        },
        where: {
          email: {
            not: "admin@solid.dev.br",
          },
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
  .mutation("create", {
    input: z.object({
      name: z.string(),
      email: z.string(),
      pricePaid: z.number(),
      phone: z.string(),
      password: z.string(),
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
          roleId: userRole!.id,
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
  });
