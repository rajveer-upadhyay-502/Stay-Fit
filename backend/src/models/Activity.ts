import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  steps: number;
  distance: number; // in km
  stepLength: number; // in cm
  flights: number; // flights climbed
  asymmetry: number; // walking asymmetry percentage
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    steps: { type: Number, default: 0 },
    distance: { type: Number, default: 0 },
    stepLength: { type: Number, default: 0 },
    flights: { type: Number, default: 0 },
    asymmetry: { type: Number, default: 0 },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

// Ensure a user can only have one activity entry per day
ActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IActivity>('Activity', ActivitySchema);
