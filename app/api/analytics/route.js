// app/api/analytics/route.js
import dbConnect from "@/lib/db";
import Subject from "@/models/Subject";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await dbConnect();

  const subjects = await Subject.find({}, { attendance_logs: 1 });

  let total = 0;
  let present = 0;     // green
  let pproxy = 0;      // orange (P+PROXY)
  let proxy = 0;       // black
  let absent = 0;      // red
  let noClass = 0;     // grey

  for (const s of subjects) {
    for (const log of s.attendance_logs || []) {
      const st = log.status;

      if (st === "grey") {
        noClass++;
        continue; // excluded from total
      }

      total++;

      if (st === "green") present++;
      else if (st === "orange") pproxy++;
      else if (st === "black") proxy++;
      else if (st === "red") absent++;
    }
  }

  return NextResponse.json(
    { total, present, pproxy, proxy, absent, noClass },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
