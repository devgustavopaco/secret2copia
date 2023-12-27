// backend/functions/updateIP.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateIP(userId: string, ip: string) {
  try {
    // Primeiro, verifique se o usuário já existe e obtenha o IP atual
    const existingUser = await prisma.iP.findUnique({
      where: { userId },
    });

    // Verifica se o IP é diferente do existente
    const hasIPChanged = existingUser && existingUser.ip !== ip;

    // Atualiza ou cria o registro de IP
    const createdOrUpdateIP = await prisma.iP.upsert({
      where: { userId },
      update: { ip },
      create: { userId, ip },
    });

    // Retorna se o IP mudou (true) ou não (false)
    return { createdOrUpdateIP, hasIPChanged };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
