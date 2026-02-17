import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Fichier manquant" },
        { status: 400 }
      );
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const dir = path.join(process.cwd(), "public", "corrections");
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, fileName);
    await writeFile(filePath, buffer);
    const fileUrl = "/corrections/" + fileName;
    return NextResponse.json({ fileUrl, fileName });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: "Erreur lors de l’upload" },
      { status: 500 }
    );
  }
}
