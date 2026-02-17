import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { dbCreateNotificationsForClass, dbGetProfile } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const classId = typeof body?.classId === "string" ? body.classId : "";
    const className = typeof body?.className === "string" ? body.className : "";
    const examNames = Array.isArray(body?.examNames) ? body.examNames.filter((x: unknown) => typeof x === "string") : [];
    const userId = typeof body?.userId === "string" ? body.userId : "";

    if (!classId || !className || !userId) {
      return NextResponse.json(
        { error: "classId, className et userId requis." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const profile = await dbGetProfile(supabase, userId);
    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    await dbCreateNotificationsForClass(supabase, classId, className, examNames);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Create notifications error:", e);
    return NextResponse.json(
      { error: "Erreur lors de la création des notifications." },
      { status: 500 }
    );
  }
}
