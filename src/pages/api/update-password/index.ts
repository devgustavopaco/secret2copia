import bcrypt from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../server/db/client";
import { sendResetPasswordEmail } from "../utils/email";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { id, password } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password in the database
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await sendResetPasswordEmail(user.email as string, password);
    res.status(200).json({ message: "Password has been updated" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};
