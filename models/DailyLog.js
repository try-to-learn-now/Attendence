// models/DailyLog.js
import mongoose from 'mongoose';

// Check if model exists before creating (Prevents build errors)
const DailyLog = mongoose.models.DailyLog || mongoose.model('DailyLog', new mongoose.Schema({
  dateString: { type: String, required: true, unique: true }, // "YYYY-MM-DD"
  biometric_done: { type: Boolean, default: false },
  is_holiday: { type: Boolean, default: false }, // NEW: Manual Holiday Override
  note: { type: String, default: '' }
}));

export default DailyLog;
