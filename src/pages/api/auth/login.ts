import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../server/db/client";
import { verifyPassword } from "../utils/verifyPassword";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { name, email, password, action, userId } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: email, roleId: "cl9lzkps90007j8u606em93nk" },
      });

      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas." });
      }

      const isPasswordValid = await verifyPassword(
        password,
        user.password || ""
      );
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciais inválidas." });
      }

      const { password: _, ...userData } = user;
      return res.status(200).json({
        message: "Login bem-sucedido.",
        user: userData,
      });
    } catch (error) {
      console.error("Erro:", error);
      return res
        .status(500)
        .json({ message: "Erro ao processar a solicitação." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
