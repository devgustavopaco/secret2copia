/* eslint-disable no-var */
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export function exclude<User, Key extends keyof User>(
  user: User,
  keys: Key[]
): Omit<User, Key> {
  // @ts-expect-error - This is intentional
  return Object.fromEntries(
    // @ts-expect-error - This is intentional
    Object.entries(user).filter(([key]) => !keys.includes(key))
  );
}
