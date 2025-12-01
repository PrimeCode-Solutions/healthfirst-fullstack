import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const configurations = await prisma.businessHours.findFirst();
    if (!configurations) {
      return NextResponse.json({ error: "Configuração não encontrada" }, { status: 404 });
    }
    return NextResponse.json(configurations, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Se não houver sessão ou ID de usuário
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // 3. Verificar permissão de ADMIN
    if (!user || user.role !== 'ADMIN') {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await prisma.businessHours.upsert({
      where: { id: body.id || "default-id" }, 
      update: { ...body },
      create: { ...body },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error(`ERROR in PUT/business-hours: ${err}`);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}