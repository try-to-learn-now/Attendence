// ===== File: app/api/attendance/check/route.js =====
import dbConnect from "@/lib/db";
import Subject from "@/models/Subject";
import { SEMESTER } from "@/lib/semester_config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isoDate(d) {
  return new Date(d).toISOString().split("T")[0];
}

export async function GET(request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);

  // Support both old + new param names (UI uses `code`)
  const code = searchParams.get("code") || searchParams.get("subjectCode");
  const date = searchParams.get("date"); // YYYY-MM-DD (optional)
  const timeSlot = searchParams.get("timeSlot"); // optional

  if (!code) {
    return NextResponse.json(
      { success: false, error: "Missing code" },
      { status: 400 }
    );
  }

  try {
    const subject = await Subject.findOne({ code }).lean();

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Subject not found" },
        { status: 404 }
      );
    }

    const semStart = new Date(SEMESTER.startDate);

    const logs = (subject.attendance_logs || []).filter(
      (l) => new Date(l.date) >= semStart
    );

    // Current slot status (if date + timeSlot provided)
    const dateStr = date ? isoDate(date) : null;
    const currentLog =
      dateStr && timeSlot
        ? logs.find(
            (l) => isoDate(l.date) === dateStr && l.timeSlot === timeSlot
          )
        : null;

    // Stats (semester only, NO CLASS ignored)
    const valid = logs.filter((l) => l.status !== "grey");
    const validClasses = valid.length;

    const teacherPresent = valid.filter((l) =>
      ["green", "orange", "black"].includes(l.status)
    ).length;

    const bioPresent = valid.filter((l) => Boolean(l.is_bio_present)).length;

    const teacherPercent = validClasses
      ? Math.round((teacherPresent / validClasses) * 100)
      : 0;

    const bioPercent = validClasses
      ? Math.round((bioPresent / validClasses) * 100)
      : 0;

    // Last logs (newest first)
    const lastLogs = [...logs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    return NextResponse.json({
      success: true,

      // Backward compatible (SubjectCard expects these)
      status: currentLog?.status ?? null,
      logs: lastLogs,
      stats: { teacher: teacherPercent, bio: bioPercent, total: validClasses },
      target_percent: subject.target_percent ?? 75,

      // Extra detail (optional use)
      current: currentLog
        ? {
            status: currentLog.status,
            topic: currentLog.topic || "",
            is_bio_present: Boolean(currentLog.is_bio_present),
            bio_override: Boolean(currentLog.bio_override),
            override_reason: currentLog.override_reason || "",
            scheduled_code: currentLog.scheduled_code || "",
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
