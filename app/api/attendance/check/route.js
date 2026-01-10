// app/api/attendance/check/route.js
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import { NextResponse } from 'next/server';

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const dateStr = searchParams.get('date'); // YYYY-MM-DD from phone

  if (!code) return NextResponse.json({ status: null });

  const subject = await Subject.findOne({ code });
  
  if (!subject) {
    return NextResponse.json({ status: null, logs: [], stats: { teacher: 0, bio: 0 } });
  }

  // 1. Find Today's Status
  let todayStatus = null;
  if (dateStr) {
    // Check if any log matches today's date (ignoring time)
    const log = subject.attendance_logs.find(l => 
      new Date(l.date).toISOString().split('T')[0] === dateStr
    );
    if (log) todayStatus = log.status;
  }

  // 2. Calculate Stats for the UI
  const logs = subject.attendance_logs;
  const validClasses = logs.filter(l => l.status !== 'grey').length;
  const teacherPresent = logs.filter(l => l.status === 'green' || l.status === 'black').length;
  const bioPresent = logs.filter(l => l.status === 'green' || l.status === 'orange').length;

  const teacherPercent = validClasses > 0 ? Math.round((teacherPresent / validClasses) * 100) : 0;
  const bioPercent = validClasses > 0 ? Math.round((bioPresent / validClasses) * 100) : 0;

  return NextResponse.json({ 
    status: todayStatus,
    logs: subject.attendance_logs, // Send logs so PDF button works
    stats: { teacher: teacherPercent, bio: bioPercent }
  });
}
