// app/api/daily-log/route.js
import dbConnect from '@/lib/db';
import DailyLog from '@/models/DailyLog';
import { NextResponse } from 'next/server';

export async function GET(request) {
  await dbConnect();
  // Get date from the URL (sent by your phone)
  const { searchParams } = new URL(request.url);
  const dateString = searchParams.get('date');

  if (!dateString) return NextResponse.json({ biometric: false });

  const log = await DailyLog.findOne({ dateString });
  return NextResponse.json({ success: true, biometric: log ? log.biometric_done : false });
}

export async function POST(req) {
  await dbConnect();
  // TRUST THE PHONE'S DATE (received from frontend)
  const { biometric, dateString } = await req.json();

  await DailyLog.findOneAndUpdate(
    { dateString: dateString },
    { biometric_done: biometric },
    { upsert: true, new: true }
  );
  
  return NextResponse.json({ success: true });
}
