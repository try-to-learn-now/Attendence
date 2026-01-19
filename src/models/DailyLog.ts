// FILE: src/models/DailyLog.ts
import mongoose, { Schema } from "mongoose";

export type DailyLogDoc = {
  date: string;
  mode: "BIOMETRIC" | "ONLINE";
  biometricDone: boolean;
  holidayOverride: "AUTO" | "FORCE_HOLIDAY" | "FORCE_WORKING";
  swaps: { timeSlot: string; toCode: string }[];
  extras: { timeSlot: string; code: string }[];
  note: string;
};

const DailyLogSchema = new Schema<DailyLogDoc>(
  {
    date: { type: String, required: true, unique: true, index: true },
    mode: { type: String, enum: ["BIOMETRIC", "ONLINE"], default: "BIOMETRIC" },
    biometricDone: { type: Boolean, default: false },
    holidayOverride: { type: String, enum: ["AUTO", "FORCE_HOLIDAY", "FORCE_WORKING"], default: "AUTO" },
    swaps: { type: Array, default: [] },
    extras: { type: Array, default: [] },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.models.DailyLog || mongoose.model<DailyLogDoc>("DailyLog", DailyLogSchema);
