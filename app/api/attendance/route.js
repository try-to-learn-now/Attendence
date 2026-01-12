// app/api/attendance/route.js
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();
  
  const { code, name, status, topic, date, timeSlot } = await req.json();

  if (!code || !status || !timeSlot) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    let subject = await Subject.findOne({ code: code });

    if (!subject) {
      subject = await Subject.create({
        name: name || "Unknown Subject",
        code: code,
        attendance_logs: []
      });
    }

    let is_bio_present = false;
    let is_teacher_present = false;
    let is_valid_class = true;

    // --- NEW 6-COLOR LOGIC ---
    if (status === 'green') { is_bio_present = true; is_teacher_present = true; }   // REAL
    if (status === 'blue')  { is_bio_present = true; is_teacher_present = true; }   // BIO-PROXY (Friend marked, I was at school)
    if (status === 'orange'){ is_bio_present = true; is_teacher_present = false; }  // BUNK (I was at school, missed class)
    if (status === 'black') { is_bio_present = false; is_teacher_present = true; }  // PROXY (No Bio, Friend marked)
    if (status === 'red')   { is_bio_present = false; is_teacher_present = false; } // ABSENT (No Bio, No Class)
    if (status === 'grey')  { is_valid_class = false; }                             // CLOSED

    // Last Tapped Logic (Overwrite if same TimeSlot & Date)
    const logDate = new Date(date).toISOString().split('T')[0];
    const existingLogIndex = subject.attendance_logs.findIndex(log => {
      const dbDate = new Date(log.date).toISOString().split('T')[0];
      return dbDate === logDate && log.timeSlot === timeSlot;
    });

    if (existingLogIndex > -1) {
      subject.attendance_logs[existingLogIndex].status = status;
      subject.attendance_logs[existingLogIndex].is_bio_present = is_bio_present;
      subject.attendance_logs[existingLogIndex].is_teacher_present = is_teacher_present;
      subject.attendance_logs[existingLogIndex].is_valid_class = is_valid_class;
      if (topic) subject.attendance_logs[existingLogIndex].topic = topic;
    } else {
      subject.attendance_logs.push({
        date: new Date(date),
        timeSlot,
        status,
        topic: topic || "",
        is_bio_present,
        is_teacher_present,
        is_valid_class
      });
    }

    await subject.save();
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
