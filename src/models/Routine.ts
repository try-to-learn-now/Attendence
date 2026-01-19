// FILE: src/models/Routine.ts
import mongoose, { Schema } from "mongoose";

export type RoutineDoc = { day: number; timeSlot: string; code: string };

const RoutineSchema = new Schema<RoutineDoc>(
  {
    day: { type: Number, required: true, index: true },
    timeSlot: { type: String, required: true, index: true },
    code: { type: String, required: true }
  },
  { timestamps: true }
);

RoutineSchema.index({ day: 1, timeSlot: 1 }, { unique: true });

export default mongoose.models.Routine || mongoose.model<RoutineDoc>("Routine", RoutineSchema);
