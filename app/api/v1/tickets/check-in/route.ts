// app/api/tickets/check-in/route.ts
import { connectDB } from '@/lib/db';
import { Ticket } from '@/app/api/v1/models/Ticket';
import { Event, ITicketType } from '@/app/api/v1/models/Event';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

interface CheckInRequest {
  ticketCode: string;
  eventId?: string;
  validatedBy?: string;
}

interface CheckInResponse {
  success: boolean;
  ticket?: {
    id: string;
    ticketCode: string;
    attendeeName: string;
    attendeeEmail: string;
    status: string;
    checkedInAt?: Date;
    event: {
      id: string;
      name: string;
      date: Date;
      time: string;
      location: string;
    };
    ticketType: string;
    price: number;
  };
  error?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.adminId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { ticketCode, eventId, validatedBy }: CheckInRequest = await request.json();

    if (!ticketCode) {
      return NextResponse.json(
        { success: false, error: 'Ticket code is required' },
        { status: 400 }
      );
    }

    // Find ticket with event details
    const ticket = await Ticket.findOne({ 
      ticketCode: ticketCode.toUpperCase().trim() 
    }).populate('eventId');

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Validate event if provided
    if (eventId && ticket.eventId._id.toString() !== eventId) {
      return NextResponse.json(
        { success: false, error: 'Ticket does not belong to this event' },
        { status: 400 }
      );
    }

    // Check ticket status
    if (ticket.status === 'revoked') {
      return NextResponse.json(
        { success: false, error: 'Ticket has been revoked' },
        { status: 400 }
      );
    }

    if (ticket.status === 'checked-in') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ticket already checked in',
          checkedInAt: ticket.checkedInAt 
        },
        { status: 400 }
      );
    }

    // Perform check-in
    ticket.status = 'checked-in';
    ticket.checkedInAt = new Date();
    ticket.validatedBy = new mongoose.Types.ObjectId(validatedBy || decoded.adminId);
    
    await ticket.save();

    // Get event details for response
    const event = await Event.findById(ticket.eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Find ticket type details with proper typing
    const ticketType = event.ticketTypes.find((type: ITicketType) => 
      type._id?.toString() === ticket.ticketTypeId
    );

    const response: CheckInResponse = {
      success: true,
      ticket: {
        id: ticket._id.toString(),
        ticketCode: ticket.ticketCode,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        status: ticket.status,
        checkedInAt: ticket.checkedInAt,
        event: {
          id: event._id.toString(),
          name: event.name,
          date: event.date,
          time: event.time,
          location: event.location
        },
        ticketType: ticketType?.name || 'Unknown',
        price: ticketType?.price || 0
      },
      message: `Successfully checked in ${ticket.attendeeName}`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Check-in failed' },
      { status: 500 }
    );
  }
}