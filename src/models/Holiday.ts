// FILE: src/models/Holiday.ts
import mongoose, { Schema, type Model } from "mongoose";

export type HolidayDoc = {
  date: string;
  label: string;
  isCancelled: boolean;
};

const HolidaySchema = new Schema<HolidayDoc>(
  {
    date: { type: String, required: true, unique: true, index: true },
    label: { type: String, default: "" },
    isCancelled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Holiday =
  (mongoose.models.Holiday as Model<HolidayDoc>) ||
  mongoose.model<HolidayDoc>("Holiday", HolidaySchema);

export default Holiday;
