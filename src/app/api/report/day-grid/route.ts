// FILE: src/app/api/report/day-grid/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import DailyLog from "@/models/DailyLog";
import Holiday from "@/models/Holiday";
import Routine from "@/models/Routine";
import Subject from "@/models/Subject";
import AttendanceEntry from "@/models/AttendanceEntry";
import { clampISO, weekdayMon1ToSun7, addDays } from "@/lib/date";
import { TIME_SLOTS, type TimeSlot } from "@/types/core";
import { applySwapsAndExtras } from "@/lib/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await dbConnect();
  const url = new URL(req.url);
  const fromQ = url.searchParams.get("from") || (process.env.SEMESTER_START || "2026-01-19");
  const toQ = url.searchParams.get("to") || fromQ;
  const [from, to] = clampISO(fromQ, toQ);

  const subjects = await Subject.find({}).lean();
  const subjMap = new Map(subjects.map((s) => [s.code, s]));

  const rows: any[] = [];

  for (let d = from; d <= to; d = addDays(d, 1)) {
    const wd = weekdayMon1ToSun7(d);
    const dayDoc = await DailyLog.findOne({ date: d }).lean();
    const day = dayDoc ?? { mode: "BIOMETRIC", biometricDone: false, holidayOverride: "AUTO", swaps: [], extras: [] };

    const holidayDb = await Holiday.findOne({ date: d }).lean();
    const dbHolidayActive = holidayDb ? !holidayDb.isCancelled : false;
    const isSunday = wd === 7;

    let isHoliday = false;
    if (day.holidayOverride === "FORCE_HOLIDAY") isHoliday = true;
    else if (day.holidayOverride === "FORCE_WORKING") isHoliday = false;
    else isHoliday = dbHolidayActive || isSunday;

    const routine = wd <= 6 ? await Routine.find({ day: wd }).lean() : [];

    const base = TIME_SLOTS.map((t) => {
      const f = routine.find((r) => r.timeSlot === t);
      if (!f) return null;
      return { timeSlot: t as TimeSlot, code: f.code };
    }).filter(Boolean) as { timeSlot: TimeSlot; code: string }[];

    const schedule = applySwapsAndExtras(base, day.swaps ?? [], day.extras ?? []);

    const entries = await AttendanceEntry.find({ date: d }).lean();
    const entryMap = new Map(entries.map((e) => [`${e.timeSlot}__${e.code}`, e.status]));

    const subjectsOut = schedule.map((c) => {
      const key = `${c.timeSlot}__${c.code}`;
      const saved = entryMap.get(key);

      // default ABSENT rule (your decision)
      const effective = saved ?? ((day.mode === "BIOMETRIC" && !day.biometricDone && !isHoliday) ? "ABSENT" : null);

      const meta = subjMap.get(c.code);
      return {
        timeSlot: c.timeSlot,
        code: c.code,
        name: meta?.name ?? c.code,
        teacher: meta?.teacher ?? "",
        type: c.type,
        status: effective
      };
    });

    rows.push({
      date: d,
      mode: day.mode,
      biometricDone: day.biometricDone,
      isHoliday,
      subjects: subjectsOut
    });
  }

  return NextResponse.json({ from, to, rows });
}
