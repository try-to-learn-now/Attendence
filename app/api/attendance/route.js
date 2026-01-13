// app/api/attendance/route.js
import dbConnect from "@/lib/db";
import Subject from "@/models/Subject";
import DailyLog from "@/models/DailyLog";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req) {
  await dbConnect();

  const {
    code,
    name,
    status,
    topic,
    date,
    timeSlot,

    // NEW
    scheduledCode,
    bioOverride,
    overrideReason,
  } = await req.json();

  if (!code || !status || !timeSlot || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const dateStr = new Date(date).toISOString().split("T")[0];

  // read daily log for biometric/holiday state
  const dlog = await DailyLog.findOne({ dateString: dateStr });
  const biometricDone = dlog?.biometric_done ?? false;
  const isHoliday = dlog?.is_holiday ?? false;

  const requiresBio = status === "green" || status === "orange";

  // Holiday mode: allow only NO CLASS by default
  if (isHoliday && status !== "grey") {
    return NextResponse.json({ error: "HOLIDAY_LOCK" }, { status: 409 });
  }

  // Biometric enforcement
  if (requiresBio && !biometricDone && !bioOverride) {
    return NextResponse.json({ error: "BIO_REQUIRED" }, { status: 409 });
  }

  const bio_done_at_save = biometricDone;
  const bio_override = requiresBio && !biometricDone && Boolean(bioOverride);
  const override_reason = bio_override ? (overrideReason || "online_class") : "";

  // derived flags
  let is_bio_present = false;
  let is_teacher_present = false;
  let is_valid_class = status !== "grey";

  if (status === "green" || status === "orange") {
    is_teacher_present = true;
    is_bio_present = biometricDone; // IMPORTANT: only true if bio done
  } else if (status === "black") {
    is_teacher_present = true;
    is_bio_present = false;
  } else if (status === "red") {
    is_teacher_present = false;
    is_bio_present = false;
  } else if (status === "grey") {
    is_teacher_present = false;
    is_bio_present = false;
    is_valid_class = false;
  }

  try {
    let subject = await Subject.findOne({ code });

    if (!subject) {
      subject = await Subject.create({
        name: name || "Unknown Subject",
        code,
        attendance_logs: [],
        target_percent: 75,
      });
    }

    const existingLogIndex = subject.attendance_logs.findIndex((log) => {
      const dbDate = new Date(log.date).toISOString().split("T")[0];
      return dbDate === dateStr && log.timeSlot === timeSlot;
    });

    const scheduled_code = scheduledCode || "";

    if (existingLogIndex > -1) {
      const log = subject.attendance_logs[existingLogIndex];
      log.status = status;
      log.topic = topic ?? log.topic;
      log.is_bio_present = is_bio_present;
      log.is_teacher_present = is_teacher_present;
      log.is_valid_class = is_valid_class;

      log.bio_done_at_save = bio_done_at_save;
      log.bio_override = bio_override;
      log.override_reason = override_reason;
      log.scheduled_code = scheduled_code;
    } else {
      subject.attendance_logs.push({
        date: new Date(dateStr),
        timeSlot,
        status,
        topic: topic || "",
        is_bio_present,
        is_teacher_present,
        is_valid_class,

        bio_done_at_save,
        bio_override,
        override_reason,
        scheduled_code,
      });
    }

    await subject.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
