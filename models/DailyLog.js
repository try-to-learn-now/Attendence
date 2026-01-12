// models/DailyLog.js
import mongoose from 'mongoose';

const DailyLogSchema = new mongoose.Schema({
  dateString: { type: String, required: true, unique: true }, // "YYYY-MM-DD"
  biometric_done: { type: Boolean, default: false },
  is_holiday: { type: Boolean, default: false }, // Manual Holiday Memory
  note: { type: String, default: '' }
});

// Fix: Prevent "OverwriteModelError" during hot reloads
export default mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);
