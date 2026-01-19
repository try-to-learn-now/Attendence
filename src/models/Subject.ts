// FILE: src/models/Subject.ts
import mongoose, { Schema, type Model } from "mongoose";

export type SubjectDoc = {
  code: string;
  name: string;
  teacher: string;
};

const SubjectSchema = new Schema<SubjectDoc>(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    teacher: { type: String, default: "" }
  },
  { timestamps: true }
);

const Subject =
  (mongoose.models.Subject as Model<SubjectDoc>) ||
  mongoose.model<SubjectDoc>("Subject", SubjectSchema);

export default Subject;
