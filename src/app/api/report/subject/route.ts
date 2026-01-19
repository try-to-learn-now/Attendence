// FILE: src/app/api/report/subject/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import AttendanceEntry from "@/models/AttendanceEntry";
import Subject from "@/models/Subject";
import { clampISO } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await dbConnect();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const fromQ = url.searchParams.get("from") || (process.env.SEMESTER_START || "2026-01-19");
  const toQ = url.searchParams.get("to") || fromQ;
  const [from, to] = clampISO(fromQ, toQ);

  const subject = await Subject.findOne({ code }).lean();
  const entries = await AttendanceEntry.find({ code, date: { $gte: from, $lte: to } }).sort({ date: 1, timeSlot: 1 }).lean();

  return NextResponse.json({ code, subject, from, to, entries });
}
