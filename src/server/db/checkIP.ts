// backend/functions/updateIP.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function updateIP(userId: string, ip: string) {
    try {
        const createdOrUpdateIP = await prisma.iP.upsert({
            where: { userId },
            update: { ip },
            create: { userId, ip },
        });
        return createdOrUpdateIP;
    } catch (error) {
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}
