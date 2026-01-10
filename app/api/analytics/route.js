// app/api/analytics/route.js
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect();
  const subjects = await Subject.find({});
  
  let total = 0;
  let real = 0;
  let bunk = 0;
  let proxy = 0;
  let absent = 0;

  subjects.forEach(sub => {
    sub.attendance_logs.forEach(log => {
      // Don't count "Grey" (Closed classes) in the total
      if (log.status !== 'grey') {
        total++;
        if (log.status === 'green') real++;
        if (log.status === 'orange') bunk++;
        if (log.status === 'black') proxy++;
        if (log.status === 'red') absent++;
      }
    });
  });

  return NextResponse.json({ total, real, bunk, proxy, absent });
}
