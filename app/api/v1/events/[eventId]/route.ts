// app/api/events/[eventId]/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/app/api/v1/models/Event';
import { Ticket } from '@/app/api/v1/models/Ticket';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Type definitions
interface TicketType {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  specialConditions?: string;
}

interface TicketTypeWithSales extends Omit<TicketType, '_id'> {
  _id: string;
  sold: number;
  available: number;
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

// Helper function to get token
const getToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

// Helper function to verify event ownership
const verifyEventOwnership = async (eventId: string, adminId: string) => {
  const event = await Event.findOne({ _id: eventId, adminId });
  if (!event) {
    throw new Error('Event not found or access denied');
  }
  return event;
};

// GET - Get single event details
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    await connectDB();
    
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await verifyEventOwnership(params.eventId, decoded.adminId);

    // Get ticket sales data
    const tickets = await Ticket.find({ eventId: params.eventId });
    
    const ticketTypesWithSales: TicketTypeWithSales[] = event.ticketTypes.map((ticketType: TicketType) => {
      const soldTickets = tickets.filter(ticket => 
        ticket.ticketTypeId === ticketType._id?.toString()
      ).length;

      const ticketTypeData = {
        name: ticketType.name,
        price: ticketType.price,
        quantity: ticketType.quantity,
        description: ticketType.description,
        specialConditions: ticketType.specialConditions
      };

      return {
        ...ticketTypeData,
        sold: soldTickets,
        available: ticketType.quantity - soldTickets,
        _id: ticketType._id?.toString() || new mongoose.Types.ObjectId().toString()
      };
    });

    const totalRevenue = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => 
      sum + (type.price * type.sold), 0
    );

    const eventWithStats: EventWithStats = {
      _id: event._id.toString(),
      adminId: event.adminId.toString(),
      name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      status: event.status,
      createdAt: event.createdAt,
      ticketTypes: ticketTypesWithSales,
      totalRevenue,
      totalTickets: ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.quantity, 0),
      totalSold: ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.sold, 0),
      totalAvailable: ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.available, 0),
      checkInCount: tickets.filter(ticket => ticket.status === 'checked-in').length,
      totalTicketCount: tickets.length
    };

    return NextResponse.json({
      success: true,
      event: eventWithStats
    });
  } catch (error: unknown) {
    console.error('❌ Get event error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event';
    const statusCode = errorMessage === 'Event not found or access denied' ? 404 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}