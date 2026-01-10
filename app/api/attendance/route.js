// app/api/attendance/route.js
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();
  const { subjectId, status, topic, date } = await req.json();

  try {
    const subject = await Subject.findById(subjectId);
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    let is_bio_present = false;
    let is_teacher_present = false;
    let is_valid_class = true;

    if (status === 'green') { is_bio_present = true; is_teacher_present = true; }
    if (status === 'black') { is_bio_present = false; is_teacher_present = true; }
    if (status === 'orange') { is_bio_present = true; is_teacher_present = false; }
    if (status === 'red') { is_bio_present = false; is_teacher_present = false; }
    if (status === 'grey') { is_valid_class = false; }

    subject.attendance_logs.push({
      date: new Date(date),
      status,
      topic,
      is_bio_present,
      is_teacher_present,
      is_valid_class
    });

    await subject.save();
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

