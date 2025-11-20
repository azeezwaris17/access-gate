// /api/tickets/validate-ticket-by-code/route.ts
import { connectDB } from '@/lib/db';
import { Ticket } from '@/app/api/models/Ticket';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { ticketCode } = await request.json();

    if (!ticketCode) {
      return NextResponse.json(
        { error: 'Ticket code required' },
        { status: 400 }
      );
    }

    const ticket = await Ticket.findOne({ ticketCode }).populate('eventId');

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (ticket.status === 'revoked') {
      return NextResponse.json(
        { error: 'Ticket has been revoked' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ticket: {
        id: ticket._id,
        ticketCode: ticket.ticketCode,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        status: ticket.status,
        event: ticket.eventId,
      },
    });
  } catch (error) {
    console.error('Ticket validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}
