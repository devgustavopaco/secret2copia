import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getActiveExchanges(email: string) {
  try {
    const user = await prisma.user.findUnique({
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
        email: email,
      },
    });
    let whereClause = {};

    if (user?.roleId === "cl9lzkps90007j8u606em93nk") {
      whereClause = {
        active: true,
      };
    } else {
      whereClause = {
        active: true,
        OR: [
          {
            platinum:
              user?.silver || user?.gold || user?.platinum || user?.bronze,
          },
          { gold: user?.gold || user?.silver || user?.bronze },
          { silver: user?.silver || user?.bronze },
          { bronze: user?.bronze },
        ],
      };
    }

    const exchanges = await prisma.exchange.findMany({
      orderBy: {
        name: "asc",
      },
      where: whereClause,
    });

    return exchanges;
  } catch (error) {
    console.error("Error fetching active exchanges:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
