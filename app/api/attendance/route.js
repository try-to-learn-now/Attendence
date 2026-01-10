// app/api/attendance/route.js
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();
  
  // 1. Receive 'code' and 'name' instead of 'subjectId'
  const { code, name, status, topic, date } = await req.json();

  if (!code || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // 2. Find Subject by CODE (Universal Link)
    let subject = await Subject.findOne({ code: code });

    // 3. Smart Auto-Create: If subject is new, create it in DB instantly
    if (!subject) {
      // Create it so we can start logging attendance immediately
      subject = await Subject.create({
        name: name || "Unknown Subject",
        code: code,
        attendance_logs: []
      });
    }

    // 4. Your "5-Color Logic" Engine
    let is_bio_present = false;
    let is_teacher_present = false;
    let is_valid_class = true;

    if (status === 'green') { is_bio_present = true; is_teacher_present = true; }   // REAL
    if (status === 'black') { is_bio_present = false; is_teacher_present = true; }  // PROXY
    if (status === 'orange') { is_bio_present = true; is_teacher_present = false; } // BUNK
    if (status === 'red') { is_bio_present = false; is_teacher_present = false; }   // ABSENT
    if (status === 'grey') { is_valid_class = false; }                              // CLOSED

    // 5. Add the Log
    subject.attendance_logs.push({
      date: new Date(date), // Saves date + time
      status,
      topic: topic || "",
      is_bio_present,
      is_teacher_present,
      is_valid_class
    });

    await subject.save();
    return NextResponse.json({ success: true, message: "Attendance Logged" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
