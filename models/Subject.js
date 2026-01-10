// models/Subject.js
import mongoose from 'mongoose';

const AttendanceLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['green', 'black', 'orange', 'red', 'grey'], 
    required: true 
  },
  topic: { type: String, default: '' },
  is_bio_present: { type: Boolean, default: false },
  is_teacher_present: { type: Boolean, default: false },
  is_valid_class: { type: Boolean, default: true }
});

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  attendance_logs: [AttendanceLogSchema]
});

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

