// /models/Event.ts
import mongoose from 'mongoose';

export interface ITicketType {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  specialConditions?: string;
}

export interface IEvent extends mongoose.Document {
  adminId: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  ticketTypes: ITicketType[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

const EventSchema = new mongoose.Schema<IEvent>({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  ticketTypes: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    description: String,
    specialConditions: String,
  }],
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
});

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);