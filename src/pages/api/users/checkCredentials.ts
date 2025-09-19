import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../server/db/client";

function generateJwtForUser(
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    password: string | null;
    role: {
      name: string;
    };
  } | null
) {
  if (!user) throw new Error("User object is null");

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role.name,
  };

  const secretKey = process.env.JWT_SECRET_KEY as string;

  const expiresIn = "6h";

  const token = jwt.sign(payload, secretKey, { expiresIn });

  return token;
}

const checkCredentials = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
      isFutures: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });
  console.log(user, user?.password);

  if (
    user &&
    user.password &&
    (await compare(req.body.password, user.password))
  ) {
    const jwtToken = generateJwtForUser(user);

    const { password, ...userWithoutPassword } = user;
    const responsePayload = {
      ...userWithoutPassword,
      jwt: jwtToken,
    };

    res.status(200).json(responsePayload);
  } else {
    res.status(400).send("Email ou senha inválidos");
  }
};

export default checkCredentials;
