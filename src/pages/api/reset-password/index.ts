// pages/api/reset-password/index.ts

import bcrypt from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../server/db/client";
import { sendResetPasswordEmail } from "../utils/email";
import { generateNewPassword } from "../utils/password";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { email } = req.body;

    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Generate a new password
    const newPassword = generateNewPassword();

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Send an email with the new password
    await sendResetPasswordEmail(email, newPassword);

    res.status(200).json({ message: "New password has been sent" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};
