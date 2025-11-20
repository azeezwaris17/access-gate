import mongoose from 'mongoose';
import { hashPassword } from '@/lib/auth';

export interface IAdmin extends mongoose.Document {
  fullName: string;
  email: string;
  passwordHash: string;
  registrationKeys: Array<{
    key: string;
    createdAt: Date;
    usedBy?: string;
    usedAt?: Date;
  }>;
  createdAt: Date;
}

const AdminSchema = new mongoose.Schema<IAdmin>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  registrationKeys: [{
    key: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    usedBy: String,
    usedAt: Date,
  }],
  createdAt: { type: Date, default: Date.now },
});

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
