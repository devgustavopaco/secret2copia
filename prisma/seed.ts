// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  try {
    console.log(`Creating user role...`);

    const userRole = await prisma.role.create({
      data: {
        name: "user",
      },
    });

    console.log(`Created user role with id: ${userRole.id}!`);
  } catch (error) {
    console.log(error);
  }

  try {
    console.log(`Creating admin role...`);

    const adminRole = await prisma.role.create({
      data: {
        name: "admin",
      },
    });

    console.log(`Created admin role with id: ${adminRole.id}!`);
  } catch (error) {
    console.log(error);
  }

  try {
    const adminRole = await prisma.role.findFirst({
      where: {
        name: "admin",
      },
    });
    const password = await hash("admin123", 8);

    console.log(`Creating admin user...`);

    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@solid.dev.br",
        password,
        roleId: adminRole!.id,
      },
    });

    console.log(`Created admin user with id: ${admin.id}`);
  } catch (error) {
    console.log(error);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
