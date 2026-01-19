// FILE: src/app/api/reset-day/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import DailyLog from "@/models/DailyLog";
import AttendanceEntry from "@/models/AttendanceEntry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Reset = z.object({ date: z.string() });

export async function POST(req: Request) {
  await dbConnect();
  const { date } = Reset.parse(await req.json());
  await DailyLog.deleteOne({ date });
  await AttendanceEntry.deleteMany({ date });
  return NextResponse.json({ ok: true });
}
