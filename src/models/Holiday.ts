// FILE: src/models/Holiday.ts
import mongoose, { Schema } from "mongoose";

export type HolidayDoc = { date: string; label: string; isCancelled: boolean };

const HolidaySchema = new Schema<HolidayDoc>(
  {
    date: { type: String, required: true, unique: true, index: true },
    label: { type: String, default: "" },
    isCancelled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Holiday || mongoose.model<HolidayDoc>("Holiday", HolidaySchema);
