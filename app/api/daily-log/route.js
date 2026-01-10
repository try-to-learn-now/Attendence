// app/api/daily-log/route.js
import dbConnect from '@/lib/db';
import DailyLog from '@/models/DailyLog';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const dateString = searchParams.get('date');

  if (!dateString) return NextResponse.json({ biometric: false });

  const log = await DailyLog.findOne({ dateString });
  return NextResponse.json({ success: true, biometric: log ? log.biometric_done : false });
}

export async function POST(req) {
  await dbConnect();
  // ACCEPT THE DATE FROM FRONTEND (Fixes Timezone)
  const { biometric, dateString } = await req.json();

  if (!dateString) return NextResponse.json({ error: "Date required" }, { status: 400 });

  await DailyLog.findOneAndUpdate(
    { dateString: dateString },
    { biometric_done: biometric },
    { upsert: true, new: true }
  );
  
  return NextResponse.json({ success: true });
}
