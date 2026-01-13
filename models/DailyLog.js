// models/DailyLog.js
import mongoose from "mongoose";

const SwapSchema = new mongoose.Schema(
  {
    timeSlot: { type: String, required: true },
    fromCode: { type: String, required: true }, // scheduled
    toCode: { type: String, required: true }, // actual
  },
  { _id: false }
);

const ExtraSchema = new mongoose.Schema(
  {
    timeSlot: { type: String, required: true },
    code: { type: String, required: true },
  },
  { _id: false }
);

const DailyLogSchema = new mongoose.Schema(
  {
    dateString: { type: String, required: true, unique: true }, // YYYY-MM-DD
    biometric_done: { type: Boolean, default: false },
    is_holiday: { type: Boolean, default: false },
    note: { type: String, default: "" },

    swaps: { type: [SwapSchema], default: [] },
    extras: { type: [ExtraSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.DailyLog || mongoose.model("DailyLog", DailyLogSchema);
