import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { ApiResponse, Ebook } from "@/types/ebook";
import { formatISO } from "date-fns";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryName = searchParams.get("category");

    const ebooks = await prisma.ebook.findMany({
      where: categoryName
        ? { category: { name: categoryName } }
        : {},
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    const data: Ebook[] = ebooks.map((ebook) => ({
      id: ebook.id,
      title: ebook.title,
      description: ebook.description ?? undefined,
      author: ebook.author,
      coverUrl: ebook.coverImage ?? undefined,
      downloadUrl: ebook.fileUrl,
      isPremium: ebook.isPremium,
      price: ebook.price ? Number(ebook.price) : undefined,
      categoryId: ebook.categoryId,
      fileSize: ebook.fileSize ?? undefined,
      fileType: ebook.fileType,
      isActive: ebook.isActive,
      downloadCount: ebook.downloadCount,
      viewCount: ebook.viewCount,
      createdAt: formatISO(ebook.createdAt),
      updatedAt: formatISO(ebook.updatedAt),
      category: {
        id: ebook.category.id,
        name: ebook.category.name,
        description: ebook.category.description ?? undefined,
        createdAt: formatISO(ebook.category.createdAt),
        updatedAt: formatISO(ebook.category.updatedAt),
      },
    }));

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    console.error("Erro ao listar ebooks:", error);
    return NextResponse.json({ success: false, data: null, error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("categoryId") as string;
    const isPremium = formData.get("isPremium") === "true";
    const author = formData.get("author") as string;
    const price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
    
    const coverFile = formData.get("coverFile") as File | null;
    const ebookFile = formData.get("ebookFile") as File | null;

    if (!ebookFile) {
      return NextResponse.json({ success: false, error: "Arquivo do ebook é obrigatório" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public/uploads/ebooks");
    await mkdir(uploadDir, { recursive: true });

    const ebookFileName = `${Date.now()}-${ebookFile.name.replace(/\s+/g, "_")}`;
    const ebookBuffer = Buffer.from(await ebookFile.arrayBuffer());
    await writeFile(path.join(uploadDir, ebookFileName), ebookBuffer);
    const ebookUrl = `/uploads/ebooks/${ebookFileName}`;

    let coverUrl = null;
    if (coverFile) {
      const coverFileName = `${Date.now()}-${coverFile.name.replace(/\s+/g, "_")}`;
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      await writeFile(path.join(uploadDir, coverFileName), coverBuffer);
      coverUrl = `/uploads/ebooks/${coverFileName}`;
    }

    const newEbook = await prisma.ebook.create({
      data: {
        title,
        description,
        author,
        categoryId,
        isPremium,
        price,
        fileUrl: ebookUrl,
        coverImage: coverUrl,
        fileType: ebookFile.name.split('.').pop() || "pdf",
        fileSize: ebookFile.size,
      },
      include: { category: true }
    });

    return NextResponse.json({ success: true, data: newEbook });

  } catch (error) {
    console.error("Erro ao criar ebook:", error);
    return NextResponse.json({ success: false, error: "Erro ao processar upload e salvar no banco" }, { status: 500 });
  }
}