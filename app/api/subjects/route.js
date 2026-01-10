// app/api/subjects/route.js
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect();
  try {
    const subjects = await Subject.find({});
    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const subject = await Subject.create(body);
    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

