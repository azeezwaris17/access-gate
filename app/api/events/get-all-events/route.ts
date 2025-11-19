import { connectDB } from '@/lib/db';
import { Event } from '@/models/Event';
import { Ticket } from '@/models/Ticket';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Type definitions that match the Mongoose model
interface TicketType {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  specialConditions?: string;
  sold?: number;
}

interface EventDocument {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  ticketTypes: TicketType[];
  createdAt: Date;
  __v?: number;
}

interface EventWithStats extends Omit<EventDocument, '_id' | 'ticketTypes'> {
  _id: string;
  ticketTypes: Array<TicketType & { sold: number; _id: string }>;
  totalRevenue: number;
  totalTickets: number;
  totalSold: number;
  computedStatus: string;
  checkInCount: number;
  totalTicketCount: number;
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
    const search = searchParams.get('search');

    // Build query filter
    let filter: any = { adminId: new mongoose.Types.ObjectId(decoded.adminId) };

    // Add status filter if provided
    if (status && status !== 'all') {
      const today = new Date();
      if (status === 'active') {
        filter.date = { $gte: today };
        // Remove status filter since we don't have status field in the model
      } else if (status === 'completed') {
        filter.date = { $lt: today };
        // Remove status filter since we don't have status field in the model
      }
      // Note: 'cancelled' status is not supported in the current model
    }

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch events with populated data - remove the type assertion and handle properly
    const events = await Event.find(filter)
      .sort({ date: 1, createdAt: -1 })
      .lean();

    // Convert to proper type and get ticket sales data for each event
    const eventsWithStats: EventWithStats[] = await Promise.all(
      events.map(async (event: any): Promise<EventWithStats> => {
        // Get all tickets for this event
        const tickets = await Ticket.find({ eventId: event._id.toString() }).lean();
        
        // Calculate ticket sales per ticket type
        const ticketTypesWithSales = event.ticketTypes.map((ticketType: TicketType) => {
          const soldTickets = tickets.filter(ticket => 
            ticket.ticketTypeId === ticketType._id?.toString()
          ).length;

          return {
            ...ticketType,
            sold: soldTickets,
            _id: ticketType._id?.toString() || new mongoose.Types.ObjectId().toString()
          };
        });

        // Calculate total revenue
        const totalRevenue = ticketTypesWithSales.reduce((sum: number, type: TicketType & { sold: number }) => {
          return sum + (type.price * (type.sold || 0));
        }, 0);

        // Calculate total tickets and sold tickets
        const totalTickets = ticketTypesWithSales.reduce((sum: number, type: TicketType) => sum + type.quantity, 0);
        const totalSold = ticketTypesWithSales.reduce((sum: number, type: TicketType & { sold: number }) => sum + (type.sold || 0), 0);

        // Determine event status based on date (since we don't have status field)
        const eventDate = new Date(event.date);
        const today = new Date();
        let computedStatus = 'active';
        
        if (eventDate < today) {
          computedStatus = 'completed';
        }

        return {
          ...event,
          _id: event._id.toString(),
          adminId: event.adminId,
          date: event.date,
          createdAt: event.createdAt,
          ticketTypes: ticketTypesWithSales,
          totalRevenue,
          totalTickets,
          totalSold,
          computedStatus,
          checkInCount: tickets.filter(ticket => ticket.status === 'checked-in').length,
          totalTicketCount: tickets.length
        };
      })
    );

    console.log(`✅ Fetched ${eventsWithStats.length} events for admin ${decoded.adminId}`);
    
    return NextResponse.json(eventsWithStats);
  } catch (error) {
    console.error('❌ Get all events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// Optional: Add support for POST to handle complex filtering
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
      search, 
      dateRange, 
      sortBy = 'date', 
      sortOrder = 'asc',
      page = 1,
      limit = 10 
    } = body;

    // Build query filter
    let filter: any = { adminId: new mongoose.Types.ObjectId(decoded.adminId) };

    // Status filter - simplified since we don't have status field
    if (status && status !== 'all') {
      const today = new Date();
      if (status === 'active') {
        filter.date = { $gte: today };
      } else if (status === 'completed') {
        filter.date = { $lt: today };
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateRange?.start && dateRange?.end) {
      filter.date = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalEvents = await Event.countDocuments(filter);

    // Fetch events with pagination
    const events = await Event.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get ticket sales data for each event
    const eventsWithStats: EventWithStats[] = await Promise.all(
      events.map(async (event: any): Promise<EventWithStats> => {
        const tickets = await Ticket.find({ eventId: event._id.toString() }).lean();
        
        const ticketTypesWithSales = event.ticketTypes.map((ticketType: TicketType) => {
          const soldTickets = tickets.filter(ticket => 
            ticket.ticketTypeId === ticketType._id?.toString()
          ).length;

          return {
            ...ticketType,
            sold: soldTickets,
            _id: ticketType._id?.toString() || new mongoose.Types.ObjectId().toString()
          };
        });

        const totalRevenue = ticketTypesWithSales.reduce((sum: number, type: TicketType & { sold: number }) => {
          return sum + (type.price * (type.sold || 0));
        }, 0);

        const totalTickets = ticketTypesWithSales.reduce((sum: number, type: TicketType) => sum + type.quantity, 0);
        const totalSold = ticketTypesWithSales.reduce((sum: number, type: TicketType & { sold: number }) => sum + (type.sold || 0), 0);

        const eventDate = new Date(event.date);
        const today = new Date();
        let computedStatus = 'active';

        if (eventDate < today) {
          computedStatus = 'completed';
        }

        return {
          ...event,
          _id: event._id.toString(),
          adminId: event.adminId,
          date: event.date,
          createdAt: event.createdAt,
          ticketTypes: ticketTypesWithSales,
          totalRevenue,
          totalTickets,
          totalSold,
          computedStatus,
          checkInCount: tickets.filter(ticket => ticket.status === 'checked-in').length,
          totalTicketCount: tickets.length
        };
      })
    );

    console.log(`✅ Fetched ${eventsWithStats.length} events (page ${page}) for admin ${decoded.adminId}`);
    
    return NextResponse.json({
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
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}