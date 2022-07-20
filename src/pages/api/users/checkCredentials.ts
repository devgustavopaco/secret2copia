// src/pages/api/examples.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { compare } from 'bcrypt'
import { prisma } from '../../../server/db/client'

const checkCredentials = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      password: true,
    },
  })

  if (
    user &&
    user.password &&
    (await compare(req.body.password, user.password))
  ) {
    const { password, ...userWithoutPassword } = user

    res.status(200).json(userWithoutPassword)
  } else {
    res.status(400).end('Email ou senha inválidos')
  }
}

export default checkCredentials
