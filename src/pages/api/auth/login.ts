import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../server/db/client";
import { verifyPassword } from "../utils/verifyPassword";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, action, userId } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password || "");
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const { password: _, ...userData } = user;
    return NextResponse.json({
      message: "Login bem-sucedido.",
      user: userData,
    });
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json(
      { message: "Erro ao processar a solicitação." },
      { status: 500 }
    );
  }
}
