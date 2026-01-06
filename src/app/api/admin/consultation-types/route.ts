import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isAdmin = searchParams.get('mode') === 'admin'; 

  const where = isAdmin ? {} : { isActive: true };

  try {
    const types = await prisma.consultationType.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar tipos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, price, description, duration } = body;

    const newType = await prisma.consultationType.create({
      data: {
        name,
        price: Number(price),
        description,
        duration: Number(duration) || 30,
        isActive: true
      }
    });

    return NextResponse.json(newType);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar tipo" }, { status: 500 });
  }
}