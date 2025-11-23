// app/api/events/[eventId]/get-selected-event-details/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/app/api/v1/models/Event';
import { Ticket } from '@/app/api/v1/models/Ticket';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Define proper TypeScript interfaces
interface TicketType {
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  specialConditions?: string;
}

interface TicketTypeWithSales extends TicketType {
  sold: number;
  available: number;
}

// Create a lean version of ITicket for use with .lean()
interface LeanTicket {
  _id: string;
  eventId: string;
  ticketTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketCode: string;
  status: 'valid' | 'checked-in' | 'revoked';
  createdAt: Date;
  checkedInAt?: Date;
  revokedAt?: Date;
  qrCode?: string;
}

interface EventWithStats {
  _id: string;
  adminId: string;
  name: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  ticketTypes: TicketTypeWithSales[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  totalRevenue: number;
  totalTickets: number;
  totalSold: number;
  totalAvailable: number;
  checkInCount: number;
  totalTicketCount: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;

    // Find event and verify ownership
    const event = await Event.findOne({ 
      _id: eventId, 
      adminId: decoded.adminId 
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    // Get ticket sales data without .lean() to maintain proper typing
    const tickets = await Ticket.find({ eventId: eventId });
    
    // Convert tickets to LeanTicket format manually
    const leanTickets: LeanTicket[] = tickets.map(ticket => ({
      _id: ticket._id.toString(),
      eventId: ticket.eventId.toString(),
      ticketTypeId: ticket.ticketTypeId,
      attendeeName: ticket.attendeeName,
      attendeeEmail: ticket.attendeeEmail,
      ticketCode: ticket.ticketCode,
      status: ticket.status,
      createdAt: ticket.createdAt,
      checkedInAt: ticket.checkedInAt,
      revokedAt: ticket.revokedAt,
      qrCode: ticket.qrCode
    }));

    // Calculate ticket sales per ticket type with proper typing
    const ticketTypesWithSales: TicketTypeWithSales[] = event.ticketTypes.map((ticketType: TicketType) => {
      const soldTickets = leanTickets.filter((ticket: LeanTicket) => 
        ticket.ticketTypeId === ticketType._id?.toString()
      ).length;

      return {
        ...ticketType,
        sold: soldTickets,
        available: ticketType.quantity - soldTickets
      };
    });

    // Calculate total revenue with proper typing
    const totalRevenue = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => {
      return sum + (type.price * type.sold);
    }, 0);

    const totalTickets = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.quantity, 0);
    const totalSold = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.sold, 0);
    const totalAvailable = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.available, 0);

    const eventWithStats: EventWithStats = {
      ...event.toObject(),
      ticketTypes: ticketTypesWithSales,
      totalRevenue,
      totalTickets,
      totalSold,
      totalAvailable,
      checkInCount: leanTickets.filter((ticket: LeanTicket) => ticket.status === 'checked-in').length,
      totalTicketCount: leanTickets.length
    };

    console.log(`✅ Fetched event details for ${eventId}`);

    return NextResponse.json(eventWithStats);

  } catch (error) {
    console.error('❌ Get event details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event details' },
      { status: 500 }
    );
  }
}