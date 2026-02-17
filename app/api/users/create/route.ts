import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { dbUpsertProfile } from "@/lib/db";

/** Mot de passe initial élève : nom normalisé (sans espaces, minuscules) + "Svt2026!" */
function initialStudentPassword(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[àáâãäå]/gi, "a")
    .replace(/[èéêë]/gi, "e")
    .replace(/[ìíîï]/gi, "i")
    .replace(/[òóôõö]/gi, "o")
    .replace(/[ùúûü]/gi, "u")
    .replace(/[ç]/gi, "c")
    .replace(/[^a-z0-9]/g, "");
  return `${normalized || "eleve"}Svt2026!`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email et nom requis." },
        { status: 400 }
      );
    }

    const password = initialStudentPassword(name);

    const supabase = createServiceRoleClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, must_change_password: true },
    });

    if (authError) {
      const msg = authError.message;
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: msg },
        { status: 400 }
      );
    }

    if (!authData?.user?.id) {
      return NextResponse.json(
        { error: "Création du compte échouée." },
        { status: 500 }
      );
    }

    await dbUpsertProfile(supabase, {
      id: authData.user.id,
      name,
      email,
      role: "student",
      must_change_password: true,
    });

    return NextResponse.json({
      id: authData.user.id,
      name,
      email,
    });
  } catch (e) {
    console.error("Create user error:", e);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte." },
      { status: 500 }
    );
  }
}
