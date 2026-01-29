// pages/api/reset-password/index.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { sendWelcomeEmail } from "../utils/email";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { email, password } = req.body;

    await sendWelcomeEmail(email, password);

    res.status(200).json({ message: "New password has been sent" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};
