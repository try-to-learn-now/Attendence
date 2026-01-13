// app/api/subjects/route.js
import dbConnect from "@/lib/db";
import Subject from "@/models/Subject";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  await dbConnect();
  try {
    const subjects = await Subject.find({}).lean();

    return NextResponse.json(
      { success: true, subjects },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const subject = await Subject.create(body);

    return NextResponse.json(
      { success: true, subject },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// UPDATED PUT — supports target_percent
export async function PUT(req) {
  await dbConnect();
  try {
    const { _id, name, code, schedule, target_percent } = await req.json();

    if (!_id) {
      return NextResponse.json(
        { success: false, error: "_id is required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const updated = await Subject.findByIdAndUpdate(
      _id,
      { name, code, schedule, target_percent },
      { new: true }
    ).lean();

    return NextResponse.json(
      { success: true, subject: updated },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
