import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;
  const body = await req.json();

  try {
    const updated = await prisma.consultationType.update({
      where: { id },
      data: {
        name: body.name,
        price: Number(body.price),
        description: body.description,
        duration: Number(body.duration),
        isActive: body.isActive
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.consultationType.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {

    return NextResponse.json({ error: "Não é possível excluir tipos que já possuem agendamentos." }, { status: 400 });
  }
}