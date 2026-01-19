// FILE: src/app/api/attendance/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import DailyLog from "@/models/DailyLog";
import AttendanceEntry from "@/models/AttendanceEntry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Upsert = z.object({
  date: z.string(),
  timeSlot: z.string(),
  code: z.string(),
  status: z.enum(["PRESENT", "PRESENT_PROXY", "PROXY", "ABSENT", "NO_CLASS"]),
  topic: z.string().optional()
});

const Clear = z.object({
  date: z.string(),
  timeSlot: z.string(),
  code: z.string()
});

export async function POST(req: Request) {
  await dbConnect();
  const body = Upsert.parse(await req.json());

  const day = await DailyLog.findOne({ date: body.date }).lean();
  const mode = (day?.mode ?? "BIOMETRIC") as "BIOMETRIC" | "ONLINE";
  const biometricDone = !!day?.biometricDone;

  // RULE: BIOMETRIC + biometricDone=false => cannot mark PRESENT/PRESENT_PROXY
  if (mode === "BIOMETRIC" && biometricDone === false) {
    if (body.status === "PRESENT" || body.status === "PRESENT_PROXY") {
      return NextResponse.json({ error: "BIO_FALSE_CANNOT_MARK_PRESENT" }, { status: 409 });
    }
  }

  const doc = await AttendanceEntry.findOneAndUpdate(
    { date: body.date, timeSlot: body.timeSlot, code: body.code },
    { $set: { status: body.status, topic: body.topic ?? "" } },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json(doc);
}

export async function DELETE(req: Request) {
  await dbConnect();
  const body = Clear.parse(await req.json());
  await AttendanceEntry.deleteOne({ date: body.date, timeSlot: body.timeSlot, code: body.code });
  return NextResponse.json({ ok: true });
}
