// models/DailyLog.js
import mongoose from 'mongoose';

// 1. Check if model already exists (Prevents OverwriteModelError during build)
// 2. Only define Schema if model DOES NOT exist
const DailyLog = mongoose.models.DailyLog || mongoose.model('DailyLog', new mongoose.Schema({
  dateString: { type: String, required: true, unique: true }, // Format: "YYYY-MM-DD"
  biometric_done: { type: Boolean, default: false },
  note: { type: String, default: '' }
}));

export default DailyLog;
