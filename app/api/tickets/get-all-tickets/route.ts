import { connectDB } from '@/lib/db';
import { Ticket } from '@/models/Ticket';
import { Event } from '@/models/Event';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Type definitions
interface TicketType {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  specialConditions?: string;
}

interface EventDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  location: string;
  ticketTypes: TicketType[];
}

interface TicketDocument {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
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

interface TicketWithDetails {
  _id: string;
  eventId: string;
  ticketTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketCode: string;
  status: 'valid' | 'checked-in' | 'revoked';
  createdAt: string;
  checkedInAt?: string;
  revokedAt?: string;
  qrCode?: string;
  event?: {
    _id: string;
    name: string;
    date: string;
    location: string;
    ticketTypes: TicketType[];
  };
  ticketType?: {
    _id: string;
    name: string;
    price: number;
  };
}

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const eventId = searchParams.get('event');
    const search = searchParams.get('search');

    // Build query filter
    let filter: any = {};

    // Get all events for this admin to filter tickets by event
    const adminEvents = await Event.find({ adminId: new mongoose.Types.ObjectId(decoded.adminId) }).select('_id').lean();
    const adminEventIds = adminEvents.map(event => event._id);
    
    filter.eventId = { $in: adminEventIds };

    // Add status filter if provided
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Add event filter if provided
    if (eventId && eventId !== 'all') {
      filter.eventId = new mongoose.Types.ObjectId(eventId);
    }

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { attendeeName: { $regex: search, $options: 'i' } },
        { attendeeEmail: { $regex: search, $options: 'i' } },
        { ticketCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch tickets with populated event data
    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Get event details for each ticket
    const ticketsWithDetails: TicketWithDetails[] = await Promise.all(
      tickets.map(async (ticket: any): Promise<TicketWithDetails> => {
        const event = await Event.findById(ticket.eventId).lean() as any;
        
        // Find the specific ticket type
        let ticketType = null;
        if (event && event.ticketTypes) {
          const foundType = event.ticketTypes.find((type: any) => 
            type._id?.toString() === ticket.ticketTypeId
          );
          if (foundType) {
            ticketType = {
              _id: foundType._id?.toString() || '',
              name: foundType.name,
              price: foundType.price
            };
          }
        }

        return {
          _id: ticket._id.toString(),
          eventId: ticket.eventId.toString(),
          ticketTypeId: ticket.ticketTypeId,
          attendeeName: ticket.attendeeName,
          attendeeEmail: ticket.attendeeEmail,
          ticketCode: ticket.ticketCode,
          status: ticket.status,
          createdAt: ticket.createdAt.toISOString(),
          checkedInAt: ticket.checkedInAt ? ticket.checkedInAt.toISOString() : undefined,
          revokedAt: ticket.revokedAt ? ticket.revokedAt.toISOString() : undefined,
          qrCode: ticket.qrCode,
          event: event ? {
            _id: event._id.toString(),
            name: event.name,
            date: event.date.toISOString(),
            location: event.location,
            ticketTypes: event.ticketTypes || []
          } : undefined,
          ticketType: ticketType || undefined
        };
      })
    );

    console.log(`✅ Fetched ${ticketsWithDetails.length} tickets for admin ${decoded.adminId}`);
    
    return NextResponse.json(ticketsWithDetails);
  } catch (error) {
    console.error('❌ Get all tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// Optional: Add POST method for complex filtering and pagination
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { 
      status, 
      eventId, 
      search, 
      dateRange,
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 20 
    } = body;

    // Build query filter
    let filter: any = {};

    // Get all events for this admin
    const adminEvents = await Event.find({ adminId: new mongoose.Types.ObjectId(decoded.adminId) }).select('_id').lean();
    const adminEventIds = adminEvents.map(event => event._id);
    
    filter.eventId = { $in: adminEventIds };

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Event filter
    if (eventId && eventId !== 'all') {
      filter.eventId = new mongoose.Types.ObjectId(eventId);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { attendeeName: { $regex: search, $options: 'i' } },
        { attendeeEmail: { $regex: search, $options: 'i' } },
        { ticketCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateRange?.start && dateRange?.end) {
      filter.createdAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalTickets = await Ticket.countDocuments(filter);

    // Fetch tickets with pagination
    const tickets = await Ticket.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get event details for each ticket
    const ticketsWithDetails: TicketWithDetails[] = await Promise.all(
      tickets.map(async (ticket: any): Promise<TicketWithDetails> => {
        const event = await Event.findById(ticket.eventId).lean() as any;
        
        let ticketType = null;
        if (event && event.ticketTypes) {
          const foundType = event.ticketTypes.find((type: any) => 
            type._id?.toString() === ticket.ticketTypeId
          );
          if (foundType) {
            ticketType = {
              _id: foundType._id?.toString() || '',
              name: foundType.name,
              price: foundType.price
            };
          }
        }

        return {
          _id: ticket._id.toString(),
          eventId: ticket.eventId.toString(),
          ticketTypeId: ticket.ticketTypeId,
          attendeeName: ticket.attendeeName,
          attendeeEmail: ticket.attendeeEmail,
          ticketCode: ticket.ticketCode,
          status: ticket.status,
          createdAt: ticket.createdAt.toISOString(),
          checkedInAt: ticket.checkedInAt ? ticket.checkedInAt.toISOString() : undefined,
          revokedAt: ticket.revokedAt ? ticket.revokedAt.toISOString() : undefined,
          qrCode: ticket.qrCode,
          event: event ? {
            _id: event._id.toString(),
            name: event.name,
            date: event.date.toISOString(),
            location: event.location,
            ticketTypes: event.ticketTypes || []
          } : undefined,
          ticketType: ticketType || undefined
        };
      })
    );

    console.log(`✅ Fetched ${ticketsWithDetails.length} tickets (page ${page}) for admin ${decoded.adminId}`);
    
    return NextResponse.json({
      tickets: ticketsWithDetails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTickets / limit),
        totalTickets,
        hasNext: page < Math.ceil(totalTickets / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Get all tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}