import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateIP(userId: string, ip: string) {
  try {
    const existingUser = await prisma.iP.findUnique({
      where: { userId },
    });

    const hasIPChanged = existingUser && existingUser.ip !== ip;

    const createdOrUpdateIP = await prisma.iP.upsert({
      where: { userId },
      update: { ip },
      create: { userId, ip },
    });

    return { createdOrUpdateIP, hasIPChanged };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
