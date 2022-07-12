import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)

  const password = await hash('admin123', 8)
  const adminUser = {
    name: 'Admin',
    email: 'admin@solid.dev.br',
    password,
  }

  const user = await prisma.user.create({
    data: adminUser,
  })

  console.log(`Created user with id: ${user.id}`)
  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
