// app/api/analytics/route.js
import dbConnect from "@/lib/db";
import Subject from "@/models/Subject";
import { SEMESTER } from "@/lib/semester_config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();

  try {
    const subjects = await Subject.find({}).lean();

    let total = 0;
    let present = 0;
    let pproxy = 0;
    let proxy = 0;
    let absent = 0;
    let noClass = 0;

    const semStart = new Date(SEMESTER.startDate);

    for (const s of subjects) {
      (s.attendance_logs || []).forEach((log) => {
        const d = new Date(log.date);
        if (d < semStart) return; // ignore before sem

        if (log.status === "grey") {
          noClass++;
          return;
        }

        total++;
        if (log.status === "green") present++;
        else if (log.status === "orange") pproxy++;
        else if (log.status === "black") proxy++;
        else if (log.status === "red") absent++;
      });
    }

    return NextResponse.json({
      success: true,
      data: { total, present, pproxy, proxy, absent, noClass },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
