// /models/Tickets.ts
import mongoose from 'mongoose';

export type TicketStatus = 'valid' | 'checked-in' | 'revoked';

export interface ITicket extends mongoose.Document {
  eventId: mongoose.Types.ObjectId;
  ticketTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketCode: string;
  status: TicketStatus;
  createdAt: Date;
  checkedInAt?: Date;
  revokedAt?: Date;
  qrCode?: string;
}

const TicketSchema = new mongoose.Schema<ITicket>({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketTypeId: { type: String, required: true },
  attendeeName: { type: String, required: true },
  attendeeEmail: { type: String, required: true },
  ticketCode: { type: String, required: true, unique: true }, // This creates an index automatically
  status: { 
    type: String, 
    enum: ['valid', 'checked-in', 'revoked'],
    default: 'valid'
  },
  createdAt: { type: Date, default: Date.now },
  checkedInAt: Date,
  revokedAt: Date,
  qrCode: String,
});

// 
TicketSchema.index({ eventId: 1, status: 1 });


export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);