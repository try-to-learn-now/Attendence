// app/api/attendance/route.js
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();
  
  const { code, name, status, topic, date, timeSlot } = await req.json();

  if (!code || !status || !timeSlot) {
    return NextResponse.json({ error: "Missing required fields (Time/Code)" }, { status: 400 });
  }

  try {
    let subject = await Subject.findOne({ code: code });

    // Auto-Create if missing
    if (!subject) {
      subject = await Subject.create({
        name: name || "Unknown Subject",
        code: code,
        attendance_logs: []
      });
    }

    // Logic Engine
    let is_bio_present = false;
    let is_teacher_present = false;
    let is_valid_class = true;

    if (status === 'green') { is_bio_present = true; is_teacher_present = true; }
    if (status === 'black') { is_bio_present = false; is_teacher_present = true; }
    if (status === 'orange') { is_bio_present = true; is_teacher_present = false; }
    if (status === 'red') { is_bio_present = false; is_teacher_present = false; }
    if (status === 'grey') { is_valid_class = false; }

    // --- FIX: Check if log exists for this Date + TimeSlot ---
    const logDate = new Date(date).toISOString().split('T')[0];
    
    const existingLogIndex = subject.attendance_logs.findIndex(log => {
      const dbDate = new Date(log.date).toISOString().split('T')[0];
      return dbDate === logDate && log.timeSlot === timeSlot;
    });

    if (existingLogIndex > -1) {
      // UPDATE EXISTING (Last Tapped Logic)
      subject.attendance_logs[existingLogIndex].status = status;
      subject.attendance_logs[existingLogIndex].is_bio_present = is_bio_present;
      subject.attendance_logs[existingLogIndex].is_teacher_present = is_teacher_present;
      subject.attendance_logs[existingLogIndex].is_valid_class = is_valid_class;
      // Don't overwrite topic if empty, unless user wants to clear it? Let's keep existing if new is empty.
      if (topic) subject.attendance_logs[existingLogIndex].topic = topic;
    } else {
      // CREATE NEW
      subject.attendance_logs.push({
        date: new Date(date),
        timeSlot, // Saves specific time (e.g. "10:00 AM")
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
