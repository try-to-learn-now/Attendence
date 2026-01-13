import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await dbConnect();

  const subjects = await Subject.find({});
  let total = 0, real = 0, pproxy = 0, proxy = 0, absent = 0;

  subjects.forEach(sub => {
    sub.attendance_logs.forEach(log => {
      if (log.status !== 'grey') {
        total++;
        if (log.status === 'green') real++;
        if (log.status === 'orange') pproxy++;
        if (log.status === 'black') proxy++;
        if (log.status === 'red') absent++;
      }
    });
  });

  return NextResponse.json(
    { total, real, pproxy, proxy, absent },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
