// FILE: src/models/Subject.ts
import mongoose, { Schema } from "mongoose";

export type SubjectDoc = { code: string; name: string; teacher: string };

const SubjectSchema = new Schema<SubjectDoc>(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    teacher: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.models.Subject || mongoose.model<SubjectDoc>("Subject", SubjectSchema);
