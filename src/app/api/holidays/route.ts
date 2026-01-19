// FILE: src/app/api/holidays/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Holiday from "@/models/Holiday";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Upsert = z.object({
  date: z.string(),
  label: z.string().optional(),
  isCancelled: z.boolean().optional()
});

export async function GET(req: Request) {
  await dbConnect();
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const q: any = {};
  if (from && to) q.date = { $gte: from, $lte: to };

  const list = await Holiday.find(q).sort({ date: 1 }).lean();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  await dbConnect();
  const body = Upsert.parse(await req.json());

  const doc = await Holiday.findOneAndUpdate(
    { date: body.date },
    { $set: { date: body.date, label: body.label ?? "", isCancelled: body.isCancelled ?? false } },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json(doc);
}
