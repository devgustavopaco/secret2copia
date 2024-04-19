import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../server/db/client";

const resetSupportPhone = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    console.log("entrei resetSupportPhone");
    const { whatsAppUrl } = req.body;

    const supportPhone = await prisma.supportPhone.findFirst();

    console.log(supportPhone);

    if (!supportPhone) {
      return res
        .status(404)
        .json({ message: "Support phone record not found" });
    }

    await prisma.supportPhone.update({
      where: { id: supportPhone.id },
      data: { number: whatsAppUrl },
    });

    res.status(200).json({ message: "Support phone number has been updated" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};

export default resetSupportPhone;
