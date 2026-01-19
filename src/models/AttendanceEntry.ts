// FILE: src/models/AttendanceEntry.ts
import mongoose, { Schema } from "mongoose";

export type AttendanceEntryDoc = {
  date: string;
  timeSlot: string;
  code: string;
  status: "PRESENT" | "PRESENT_PROXY" | "PROXY" | "ABSENT" | "NO_CLASS";
  topic: string;
};

const AttendanceEntrySchema = new Schema<AttendanceEntryDoc>(
  {
    date: { type: String, required: true, index: true },
    timeSlot: { type: String, required: true, index: true },
    code: { type: String, required: true, index: true },
    status: { type: String, required: true },
    topic: { type: String, default: "" }
  },
  { timestamps: true }
);

AttendanceEntrySchema.index({ date: 1, timeSlot: 1, code: 1 }, { unique: true });

export default mongoose.models.AttendanceEntry ||
  mongoose.model<AttendanceEntryDoc>("AttendanceEntry", AttendanceEntrySchema);
