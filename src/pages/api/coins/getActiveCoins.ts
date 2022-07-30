// src/pages/api/examples.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../server/db/client'

const getActiveCoins = async (req: NextApiRequest, res: NextApiResponse) => {
  const coins = await prisma.coin.findMany({
    where: {
      active: true,
    },
  })

  res.status(200).json(coins)
}

export default getActiveCoins
