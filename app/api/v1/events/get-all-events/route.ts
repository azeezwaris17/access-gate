// app/api/events/get-all-events/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/app/api/v1/models/Event';
import { Ticket } from '@/app/api/v1/models/Ticket';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { FilterQuery, Types } from 'mongoose';

// Type definitions
interface TicketType {
  _id?: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  specialConditions?: string;
}

interface EventDocument {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  name: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  ticketTypes: TicketType[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  __v?: number;
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
  computedStatus: string;
  checkInCount: number;
  totalTicketCount: number;
}

interface LeanTicket {
  _id: Types.ObjectId;
  eventId: string;
  ticketTypeId: string;
  status: string;
  attendeeName?: string;
  attendeeEmail?: string;
  ticketCode?: string;
  createdAt?: Date;
  checkedInAt?: Date;
  revokedAt?: Date;
  qrCode?: string;
}

// Helper function to get token
const getToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

// GET - Get all events with filtering and pagination
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query filter with proper typing
    const filter: FilterQuery<EventDocument> = { 
      adminId: new mongoose.Types.ObjectId(decoded.adminId) 
    };

    // Enhanced status filter
    if (status && status !== 'all') {
      const today = new Date();
      
      if (status === 'active') {
        filter.status = 'active';
        filter.date = { $gte: today };
      } else if (status === 'completed') {
        filter.$or = [
          { status: 'completed' },
          { 
            date: { $lt: today }, 
            status: 'active' 
          }
        ] as FilterQuery<EventDocument>['$or'];
      } else if (status === 'cancelled') {
        filter.status = 'cancelled';
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ] as FilterQuery<EventDocument>['$or'];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalEvents = await Event.countDocuments(filter);

    // Fetch events with pagination
    const events = await Event.find(filter)
      .sort({ date: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Type assertion for lean events
    const leanEvents = events as unknown as (EventDocument & { _id: Types.ObjectId })[];
    
    // Get ticket sales data for each event
    const eventsWithStats: EventWithStats[] = await Promise.all(
      leanEvents.map(async (event) => {
        const tickets = await Ticket.find({ eventId: event._id.toString() }).lean();
        
        // Type assertion for lean tickets
        const leanTickets = tickets as unknown as LeanTicket[];
        
        const ticketTypesWithSales: TicketTypeWithSales[] = event.ticketTypes.map((ticketType) => {
          const soldTickets = leanTickets.filter((ticket) => 
            ticket.ticketTypeId === ticketType._id?.toString()
          ).length;

          const availableTickets = ticketType.quantity - soldTickets;

          return {
            name: ticketType.name,
            price: ticketType.price,
            quantity: ticketType.quantity,
            description: ticketType.description,
            specialConditions: ticketType.specialConditions,
            sold: soldTickets,
            available: availableTickets,
            _id: ticketType._id?.toString() || new mongoose.Types.ObjectId().toString()
          };
        });

        const totalRevenue = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => 
          sum + (type.price * type.sold), 0
        );

        const totalTickets = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => 
          sum + type.quantity, 0
        );
        
        const totalSold = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => 
          sum + type.sold, 0
        );
        
        const totalAvailable = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => 
          sum + type.available, 0
        );

        const eventDate = new Date(event.date);
        const today = new Date();
        let computedStatus = event.status;

        if (event.status === 'active' && eventDate < today) {
          computedStatus = 'completed';
        }

        return {
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
          totalTickets,
          totalSold,
          totalAvailable,
          computedStatus,
          checkInCount: leanTickets.filter((ticket) => ticket.status === 'checked-in').length,
          totalTicketCount: leanTickets.length
        };
      })
    );

    return NextResponse.json({
      success: true,
      events: eventsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
        totalEvents,
        hasNext: page < Math.ceil(totalEvents / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Get all events error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}