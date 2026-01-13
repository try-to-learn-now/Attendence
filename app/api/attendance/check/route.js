// app/api/attendance/check/route.js
import dbConnect from "@/lib/db";
import Subject from "@/models/Subject";
import { SEMESTER } from "@/lib/semester_config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const subjectCode = searchParams.get("subjectCode");

  if (!subjectCode) {
    return NextResponse.json({ success: false, error: "Missing subjectCode" }, { status: 400 });
  }

  try {
    const subject = await Subject.findOne({ code: subjectCode }).lean();

    if (!subject) {
      return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });
    }

    const semStart = new Date(SEMESTER.startDate);
    const logs = subject.attendance_logs || [];

    const filtered = logs.filter((l) => new Date(l.date) >= semStart);

    const validClasses = filtered.filter((l) => l.status !== "grey").length;
    const teacherPresent = filtered.filter(
      (l) => l.status === "green" || l.status === "orange" || l.status === "black"
    ).length;
    const bioPresent = filtered.filter((l) => l.is_bio_present).length;

    const teacherPercent = validClasses ? Math.round((teacherPresent / validClasses) * 100) : 0;
    const bioPercent = validClasses ? Math.round((bioPresent / validClasses) * 100) : 0;

    return NextResponse.json({
      success: true,
      teacher: teacherPercent,
      bio: bioPercent,
      total: validClasses,
      target_percent: subject.target_percent ?? 75,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
