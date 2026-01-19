// FILE: src/app/api/meta/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    semesterStart: process.env.SEMESTER_START || "2026-01-19"
  });
}
