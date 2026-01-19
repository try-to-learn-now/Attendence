// FILE: src/models/DailyLog.ts
import mongoose, { Schema, type Model } from "mongoose";

export type DailyLogDoc = {
  date: string;
  mode: "BIOMETRIC" | "ONLINE";
  biometricDone: boolean;
  holidayOverride: "AUTO" | "FORCE_HOLIDAY" | "FORCE_WORKING";
  swaps: { timeSlot: string; toCode: string }[];
  extras: { timeSlot: string; code: string }[];
  note: string;
};

const SwapSchema = new Schema(
  {
    timeSlot: { type: String, required: true },
    toCode: { type: String, required: true }
  },
  { _id: false }
);

const ExtraSchema = new Schema(
  {
    timeSlot: { type: String, required: true },
    code: { type: String, required: true }
  },
  { _id: false }
);

const DailyLogSchema = new Schema<DailyLogDoc>(
  {
    date: { type: String, required: true, unique: true, index: true },
    mode: { type: String, enum: ["BIOMETRIC", "ONLINE"], default: "BIOMETRIC" },
    biometricDone: { type: Boolean, default: false },
    holidayOverride: {
      type: String,
      enum: ["AUTO", "FORCE_HOLIDAY", "FORCE_WORKING"],
      default: "AUTO"
    },
    swaps: { type: [SwapSchema], default: [] },
    extras: { type: [ExtraSchema], default: [] },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

const DailyLog =
  (mongoose.models.DailyLog as Model<DailyLogDoc>) ||
  mongoose.model<DailyLogDoc>("DailyLog", DailyLogSchema);

export default DailyLog;
