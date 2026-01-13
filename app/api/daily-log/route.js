// app/api/daily-log/route.js
import dbConnect from "@/lib/db";
import DailyLog from "@/models/DailyLog";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const dateString = searchParams.get("date");

  if (!dateString) {
    return NextResponse.json({
      success: true,
      biometric: false,
      is_holiday: false,
      swaps: [],
      extras: [],
    });
  }

  const log = await DailyLog.findOne({ dateString });

  return NextResponse.json({
    success: true,
    biometric: log?.biometric_done ?? false,
    is_holiday: log?.is_holiday ?? false,
    swaps: log?.swaps ?? [],
    extras: log?.extras ?? [],
  });
}

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  const { dateString } = body;

  if (!dateString) {
    return NextResponse.json({ error: "Date required" }, { status: 400 });
  }

  let log = await DailyLog.findOne({ dateString });
  if (!log) log = new DailyLog({ dateString });

  // biometric / holiday toggles
  if (typeof body.biometric !== "undefined") log.biometric_done = body.biometric;
  if (typeof body.is_holiday !== "undefined") log.is_holiday = body.is_holiday;

  // SWAP upsert/remove by timeSlot
  if (body.swap) {
    const { timeSlot, fromCode, toCode } = body.swap;
    if (!timeSlot || !fromCode || !toCode) {
      return NextResponse.json({ error: "swap requires timeSlot/fromCode/toCode" }, { status: 400 });
    }
    log.swaps = log.swaps.filter((s) => s.timeSlot !== timeSlot);
    log.swaps.push({ timeSlot, fromCode, toCode });
  }

  if (body.removeSwap) {
    const { timeSlot } = body.removeSwap;
    log.swaps = log.swaps.filter((s) => s.timeSlot !== timeSlot);
  }

  // EXTRA upsert/remove by (timeSlot, code)
  if (body.extra) {
    const { timeSlot, code } = body.extra;
    if (!timeSlot || !code) {
      return NextResponse.json({ error: "extra requires timeSlot and code" }, { status: 400 });
    }
    const exists = log.extras.some((e) => e.timeSlot === timeSlot && e.code === code);
    if (!exists) log.extras.push({ timeSlot, code });
  }

  if (body.removeExtra) {
    const { timeSlot, code } = body.removeExtra;
    log.extras = log.extras.filter((e) => !(e.timeSlot === timeSlot && e.code === code));
  }

  await log.save();
  return NextResponse.json({ success: true });
}
