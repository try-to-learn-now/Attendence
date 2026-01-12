// app/api/daily-log/route.js
import dbConnect from '@/lib/db';
import DailyLog from '@/models/DailyLog';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const dateString = searchParams.get('date');

  if (!dateString) return NextResponse.json({ biometric: false, is_holiday: false });

  const log = await DailyLog.findOne({ dateString });
  return NextResponse.json({ 
    success: true, 
    biometric: log ? log.biometric_done : false,
    is_holiday: log ? log.is_holiday : false 
  });
}

export async function POST(req) {
  await dbConnect();
  const { biometric, is_holiday, dateString } = await req.json();

  if (!dateString) return NextResponse.json({ error: "Date required" }, { status: 400 });

  let updateData = {};
  if (typeof biometric !== 'undefined') updateData.biometric_done = biometric;
  if (typeof is_holiday !== 'undefined') updateData.is_holiday = is_holiday;

  await DailyLog.findOneAndUpdate(
    { dateString: dateString },
    updateData,
    { upsert: true, new: true }
  );
  
  return NextResponse.json({ success: true });
}
