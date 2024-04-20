import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getSupportNumber() {
  try {
    const supportPhoneRecord = await prisma.supportPhone.findFirst({
      select: {
        number: true,
      },
    });

    if (supportPhoneRecord) {
      return supportPhoneRecord.number;
    } else {
      console.log("No active support phone number found.");
      return null;
    }
  } catch (error) {
    console.error("Error retrieving the support phone number:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
