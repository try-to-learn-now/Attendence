// app/api/daily-log/route.js
import dbConnect from '@/lib/db';
import DailyLog from '@/models/DailyLog';
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect();
  // Get today's log (using local date string)
  const today = new Date().toISOString().split('T')[0]; 
  const log = await DailyLog.findOne({ dateString: today });
  return NextResponse.json({ success: true, biometric: log ? log.biometric_done : false });
}

export async function POST(req) {
  await dbConnect();
  const { biometric } = await req.json();
  const today = new Date().toISOString().split('T')[0];

  // Update or Create today's log
  await DailyLog.findOneAndUpdate(
    { dateString: today },
    { biometric_done: biometric },
    { upsert: true, new: true }
  );
  
  return NextResponse.json({ success: true });
}
