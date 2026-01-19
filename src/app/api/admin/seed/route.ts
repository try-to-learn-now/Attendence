// FILE: src/app/api/admin/seed/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Subject from "@/models/Subject";
import Routine from "@/models/Routine";
import { SEED_SUBJECTS, SEED_ROUTINE } from "@/lib/seedData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_KEY || "";
  const got = req.headers.get("x-admin-key") || "";
  if (!adminKey || got !== adminKey) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  await dbConnect();

  for (const s of SEED_SUBJECTS) {
    await Subject.updateOne({ code: s.code }, { $set: s }, { upsert: true });
  }
  for (const r of SEED_ROUTINE) {
    await Routine.updateOne({ day: r.day, timeSlot: r.timeSlot }, { $set: r }, { upsert: true });
  }

  return NextResponse.json({ ok: true, subjects: SEED_SUBJECTS.length, routine: SEED_ROUTINE.length });
}
