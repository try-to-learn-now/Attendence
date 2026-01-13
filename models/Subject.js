// models/Subject.js
import mongoose from "mongoose";

const AttendanceLogSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // "10:00 AM"
    status: {
      type: String,
      enum: ["green", "black", "orange", "red", "grey"],
      required: true,
    },
    topic: { type: String, default: "" },

    // derived flags (you already use these)
    is_bio_present: { type: Boolean, default: false },
    is_teacher_present: { type: Boolean, default: false },
    is_valid_class: { type: Boolean, default: true },

    // NEW
    bio_done_at_save: { type: Boolean, default: false },
    bio_override: { type: Boolean, default: false },
    override_reason: { type: String, default: "" },

    // SWAP support: what was scheduled at that time
    scheduled_code: { type: String, default: "" },
  },
  { _id: false }
);

const SubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },

    // optional: keep if you use it later
    schedule: [{ day: { type: Number }, time: { type: String } }],

    target_percent: { type: Number, default: 75 },

    attendance_logs: { type: [AttendanceLogSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);
