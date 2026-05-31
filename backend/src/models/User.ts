import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  phoneNumber?: string;
  email?: string;
  firebaseUid: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phoneNumber: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    firebaseUid: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
