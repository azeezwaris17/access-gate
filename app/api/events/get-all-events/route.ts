// app/api/events/get-all-events/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/app/api/models/Event';
import { Ticket } from '@/app/api/models/Ticket';
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
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  __v?: number;
}

interface TicketTypeWithSales extends Omit<TicketType, '_id'> {
  _id: string;
  sold: number;
  available: number; // Add available field
}

interface EventWithStats extends Omit<EventDocument, '_id' | 'ticketTypes' | 'adminId'> {
  _id: string;
  adminId: string;
  ticketTypes: TicketTypeWithSales[];
  totalRevenue: number;
  totalTickets: number;
  totalSold: number;
  totalAvailable: number; // Add total available field
  computedStatus: string;
  checkInCount: number;
  totalTicketCount: number;
}



interface OrCondition {
  name?: { $regex: string; $options: string };
  location?: { $regex: string; $options: string };
  description?: { $regex: string; $options: string };
  status?: 'active' | 'completed' | 'cancelled';
  date?: {
    $gte?: Date;
    $lt?: Date;
    $lte?: Date;
  };
}

interface EventFilter {
  adminId: mongoose.Types.ObjectId;
  status?: 'active' | 'completed' | 'cancelled';
  date?: {
    $gte?: Date;
    $lt?: Date;
    $lte?: Date;
  };
  $or?: OrCondition[];
}

interface SortObject {
  [key: string]: 1 | -1;
}

// Simplified type for lean documents - use type assertion in the map function
interface LeanEvent {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
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
    const filter: EventFilter = { adminId: new mongoose.Types.ObjectId(decoded.adminId) };

    // Enhanced status filter using the actual status field
    if (status && status !== 'all') {
      const today = new Date();
      
      if (status === 'active') {
        // Active events: status is active AND date is in future or today
        filter.status = 'active';
        filter.date = { $gte: today };
      } else if (status === 'completed') {
        // Completed events: status is completed OR (date is in past AND status is active)
        filter.$or = [
          { status: 'completed' },
          { date: { $lt: today }, status: 'active' } // Auto-complete past active events
        ];
      } else if (status === 'cancelled') {
        // Only cancelled events
        filter.status = 'cancelled';
      } else if (status === 'upcoming') {
        // Upcoming events: active and in future
        filter.status = 'active';
        filter.date = { $gte: today };
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

    // Fetch events with populated data
    const events = await Event.find(filter)
      .sort({ date: 1, createdAt: -1 })
      .lean();

    // Convert to proper type and get ticket sales data for each event
    const eventsWithStats: EventWithStats[] = await Promise.all(
      events.map(async (event): Promise<EventWithStats> => {
        // Type assertion to avoid TypeScript errors
        const leanEvent = event as unknown as LeanEvent;
        
        // Get all tickets for this event
        const tickets = await Ticket.find({ eventId: leanEvent._id.toString() }).lean();
        
        // Calculate ticket sales per ticket type with available count
        const ticketTypesWithSales: TicketTypeWithSales[] = leanEvent.ticketTypes.map((ticketType: TicketType) => {
          const soldTickets = tickets.filter(ticket => 
            ticket.ticketTypeId === ticketType._id?.toString()
          ).length;

          const availableTickets = ticketType.quantity - soldTickets;

          return {
            ...ticketType,
            sold: soldTickets,
            available: availableTickets,
            _id: ticketType._id?.toString() || new mongoose.Types.ObjectId().toString()
          };
        });

        // Calculate total revenue
        const totalRevenue = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => {
          return sum + (type.price * type.sold);
        }, 0);

        // Calculate total tickets, sold tickets, and available tickets
        const totalTickets = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.quantity, 0);
        const totalSold = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.sold, 0);
        const totalAvailable = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.available, 0);

        // Determine computed status based on both the status field and date logic
        const eventDate = new Date(leanEvent.date);
        const today = new Date();
        let computedStatus = leanEvent.status;

        // Auto-update status based on date if still active
        if (leanEvent.status === 'active' && eventDate < today) {
          computedStatus = 'completed';
        }

        return {
          _id: leanEvent._id.toString(),
          adminId: leanEvent.adminId.toString(),
          name: leanEvent.name,
          date: leanEvent.date,
          time: leanEvent.time,
          location: leanEvent.location,
          description: leanEvent.description,
          status: leanEvent.status,
          createdAt: leanEvent.createdAt,
          ticketTypes: ticketTypesWithSales,
          totalRevenue,
          totalTickets,
          totalSold,
          totalAvailable,
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

// POST request body interface
interface PostRequestBody {
  status?: string;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Define a more flexible filter type for complex queries
type MongoFilter = {
  adminId: mongoose.Types.ObjectId;
  status?: 'active' | 'completed' | 'cancelled';
  date?: {
    $gte?: Date;
    $lt?: Date;
    $lte?: Date;
  };
  $or?: Array<{
    name?: { $regex: string; $options: string };
    location?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
    status?: 'active' | 'completed' | 'cancelled';
    date?: {
      $gte?: Date;
      $lt?: Date;
      $lte?: Date;
    };
  }>;
};

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

    const body: PostRequestBody = await request.json();
    const { 
      status, 
      search, 
      dateRange, 
      sortBy = 'date', 
      sortOrder = 'asc',
      page = 1,
      limit = 10 
    } = body;

    // Build query filter with proper typing
    const filter: MongoFilter = { adminId: new mongoose.Types.ObjectId(decoded.adminId) };

    // Enhanced status filter using the actual status field
    if (status && status !== 'all') {
      const today = new Date();
      
      if (status === 'active') {
        filter.status = 'active';
        filter.date = { $gte: today };
      } else if (status === 'completed') {
        // Use $or for completed status
        filter.$or = [
          { status: 'completed' },
          { date: { $lt: today }, status: 'active' }
        ];
      } else if (status === 'cancelled') {
        filter.status = 'cancelled';
      } else if (status === 'upcoming') {
        filter.status = 'active';
        filter.date = { $gte: today };
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
    const sort: SortObject = {};
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
      events.map(async (event): Promise<EventWithStats> => {
        // Type assertion to avoid TypeScript errors
        const leanEvent = event as unknown as LeanEvent;
        
        const tickets = await Ticket.find({ eventId: leanEvent._id.toString() }).lean();
        
        const ticketTypesWithSales: TicketTypeWithSales[] = leanEvent.ticketTypes.map((ticketType: TicketType) => {
          const soldTickets = tickets.filter(ticket => 
            ticket.ticketTypeId === ticketType._id?.toString()
          ).length;

          const availableTickets = ticketType.quantity - soldTickets;

          return {
            ...ticketType,
            sold: soldTickets,
            available: availableTickets,
            _id: ticketType._id?.toString() || new mongoose.Types.ObjectId().toString()
          };
        });

        const totalRevenue = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => {
          return sum + (type.price * type.sold);
        }, 0);

        const totalTickets = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.quantity, 0);
        const totalSold = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.sold, 0);
        const totalAvailable = ticketTypesWithSales.reduce((sum: number, type: TicketTypeWithSales) => sum + type.available, 0);

        const eventDate = new Date(leanEvent.date);
        const today = new Date();
        let computedStatus = leanEvent.status;

        if (leanEvent.status === 'active' && eventDate < today) {
          computedStatus = 'completed';
        }

        return {
          _id: leanEvent._id.toString(),
          adminId: leanEvent.adminId.toString(),
          name: leanEvent.name,
          date: leanEvent.date,
          time: leanEvent.time,
          location: leanEvent.location,
          description: leanEvent.description,
          status: leanEvent.status,
          createdAt: leanEvent.createdAt,
          ticketTypes: ticketTypesWithSales,
          totalRevenue,
          totalTickets,
          totalSold,
          totalAvailable,
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