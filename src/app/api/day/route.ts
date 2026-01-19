// FILE: src/app/api/day/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import DailyLog from "@/models/DailyLog";
import Routine from "@/models/Routine";
import Subject from "@/models/Subject";
import Holiday from "@/models/Holiday";
import AttendanceEntry from "@/models/AttendanceEntry";
import { weekdayMon1ToSun7 } from "@/lib/date";
import { TIME_SLOTS, type TimeSlot } from "@/types/core";
import { applySwapsAndExtras } from "@/lib/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Upsert = z.object({
  date: z.string(),
  mode: z.enum(["BIOMETRIC", "ONLINE"]).optional(),
  biometricDone: z.boolean().optional(),
  holidayOverride: z.enum(["AUTO", "FORCE_HOLIDAY", "FORCE_WORKING"]).optional(),
  swaps: z.array(z.object({ timeSlot: z.string(), toCode: z.string() })).optional(),
  extras: z.array(z.object({ timeSlot: z.string(), code: z.string() })).optional(),
  note: z.string().optional()
});

function semesterStart() {
  return process.env.SEMESTER_START || "2026-01-19";
}

export async function GET(req: Request) {
  await dbConnect();
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const dayDoc = await DailyLog.findOne({ date }).lean();
  const day =
    dayDoc ??
    ({
      date,
      mode: "BIOMETRIC",
      biometricDone: false,
      holidayOverride: "AUTO",
      swaps: [],
      extras: [],
      note: ""
    } as any);

  const subjects = await Subject.find({}).sort({ code: 1 }).lean();

  const wd = weekdayMon1ToSun7(date); // 1..7
  const routine = wd <= 6 ? await Routine.find({ day: wd }).lean() : [];

  const isSunday = wd === 7;
  const holidayDb = await Holiday.findOne({ date }).lean();
  const dbHolidayActive = holidayDb ? !holidayDb.isCancelled : false;

  let isHoliday = false;
  let holidayLabel = "";

  if (day.holidayOverride === "FORCE_HOLIDAY") {
    isHoliday = true;
    holidayLabel = "Manual Holiday";
  } else if (day.holidayOverride === "FORCE_WORKING") {
    isHoliday = false;
  } else {
    if (dbHolidayActive) {
      isHoliday = true;
      holidayLabel = holidayDb?.label || "Holiday";
    } else if (isSunday) {
      isHoliday = true;
      holidayLabel = "Sunday";
    }
  }

  const entries = await AttendanceEntry.find({ date }).lean();

  const base = TIME_SLOTS.map((t) => {
    const found = routine.find((r) => r.timeSlot === t);
    if (!found) return null;
    return { timeSlot: t as TimeSlot, code: found.code };
  }).filter(Boolean) as { timeSlot: TimeSlot; code: string }[];

  const schedule = applySwapsAndExtras(base, day.swaps ?? [], day.extras ?? []);

  return NextResponse.json({
    semesterStart: semesterStart(),
    day,
    isHoliday,
    holidayLabel,
    subjects,
    routine,
    schedule,
    entries
  });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = Upsert.parse(await req.json());

  const set: any = { ...body };
  if (set.mode === "ONLINE") set.biometricDone = false; // mutual exclusive

  const doc = await DailyLog.findOneAndUpdate({ date: body.date }, { $set: set }, { upsert: true, new: true }).lean();
  return NextResponse.json(doc);
}
