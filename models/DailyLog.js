// models/DailyLog.js
import mongoose from 'mongoose';

const DailyLogSchema = new mongoose.Schema({
  dateString: { type: String, required: true, unique: true }, // Format: "YYYY-MM-DD"
  biometric_done: { type: Boolean, default: false },
  note: { type: String, default: '' } // Any daily remark
});

export default mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);
