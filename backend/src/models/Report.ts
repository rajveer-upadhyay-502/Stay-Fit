import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: 'Scan' | 'Upload' | 'Connect' | 'Manual';
  fileUrl?: string;
  parsedData?: Record<string, any>;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['Scan', 'Upload', 'Connect', 'Manual'], required: true },
    fileUrl: { type: String },
    parsedData: { type: Schema.Types.Map, of: Schema.Types.Mixed },
    date: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true }
);

// Index to quickly query user's reports sorted by date
ReportSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IReport>('Report', ReportSchema);
