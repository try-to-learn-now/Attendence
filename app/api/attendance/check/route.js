// app/api/attendance/check/route.js
import dbConnect from "@/lib/db";
import Subject from "@/models/Subject";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const dateStr = searchParams.get("date");
  const timeSlot = searchParams.get("timeSlot");

  if (!code) return NextResponse.json({ status: null });

  const subject = await Subject.findOne({ code });

  if (!subject) {
    return NextResponse.json({
      status: null,
      logs: [],
      stats: { teacher: 0, bio: 0 },
      target_percent: 75,
    });
  }

  // slot status
  let todayStatus = null;

  if (dateStr) {
    const log = subject.attendance_logs.find((l) => {
      const d = new Date(l.date).toISOString().split("T")[0];
      const timeOk = timeSlot ? l.timeSlot === timeSlot : true;
      return d === dateStr && timeOk;
    });

    if (log) todayStatus = log.status;
  }

  // stats
  const logs = subject.attendance_logs;

  const validClasses = logs.filter((l) => l.status !== "grey").length;

  // ✅ FIX: orange must also count as teacher present
  const teacherPresent = logs.filter(
    (l) => l.status === "green" || l.status === "orange" || l.status === "black"
  ).length;

  const bioPresent = logs.filter((l) => l.is_bio_present).length;

  const teacherPercent = validClasses
    ? Math.round((teacherPresent / validClasses) * 100)
    : 0;

  const bioPercent = validClasses
    ? Math.round((bioPresent / validClasses) * 100)
    : 0;

  return NextResponse.json({
    status: todayStatus,
    logs,
    stats: { teacher: teacherPercent, bio: bioPercent },
    target_percent: subject.target_percent ?? 75,
  });
}
