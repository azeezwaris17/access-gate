// /api/events/create-event/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '../../models/Event';
import { Ticket } from '../../models/Ticket';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function getAdminId(request: NextRequest): string | null {
  const token = getToken(request);
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.adminId || null;
}

function generateTicketCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const adminId = getAdminId(request);
    
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, date, time, location, description, ticketTypes, initialTickets } = await request.json();

    // Create event
    const event = new Event({
      adminId,
      name,
      date: new Date(date),
      time,
      location,
      description,
      ticketTypes,
    });

    await event.save();

    // Create initial tickets if specified
    const createdTickets = [];
    if (initialTickets && initialTickets.length > 0) {
      for (const ticketData of initialTickets) {
        const ticketCode = generateTicketCode();
        const ticket = new Ticket({
          eventId: event._id,
          ticketTypeId: ticketData.ticketTypeId,
          attendeeName: ticketData.attendeeName,
          attendeeEmail: ticketData.attendeeEmail,
          ticketCode,
          status: 'valid',
        });

        await ticket.save();
        createdTickets.push({
          _id: ticket._id,
          ticketCode: ticket.ticketCode,
          attendeeName: ticket.attendeeName,
          attendeeEmail: ticket.attendeeEmail,
          status: ticket.status,
        });
      }
    }

    return NextResponse.json({
      event: {
        _id: event._id,
        name: event.name,
        date: event.date,
        time: event.time,
        location: event.location,
        description: event.description,
        ticketTypes: event.ticketTypes,
        createdAt: event.createdAt,
      },
      tickets: createdTickets,
      message: `Event created successfully with ${createdTickets.length} tickets`
    });
  } catch (error) {
    console.error('Event creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}