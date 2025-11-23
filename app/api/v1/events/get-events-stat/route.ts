// app/api/events/get-events-stat/route.ts
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
}

// Type for lean event result
interface LeanEvent {
  _id: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

// Helper function to get token
const getToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

// GET - Get events statistics
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

    const adminId = new mongoose.Types.ObjectId(decoded.adminId);

    // Get total events count by status
    const totalEvents = await Event.countDocuments({ adminId });
    const activeEvents = await Event.countDocuments({ 
      adminId, 
      status: 'active',
      date: { $gte: new Date() }
    });
    const completedEvents = await Event.countDocuments({
      adminId,
      $or: [
        { status: 'completed' },
        { status: 'active', date: { $lt: new Date() } }
      ]
    });
    const cancelledEvents = await Event.countDocuments({ 
      adminId, 
      status: 'cancelled' 
    });

    // Get total revenue and tickets data
    const allEvents = await Event.find({ adminId }) as EventDocument[];
    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let totalTicketsAvailable = 0;

    for (const event of allEvents) {
      const tickets = await Ticket.find({ eventId: event._id.toString() });
      
      for (const ticketType of event.ticketTypes) {
        const soldTickets = tickets.filter(ticket => 
          ticket.ticketTypeId === ticketType._id?.toString()
        ).length;
        
        totalRevenue += ticketType.price * soldTickets;
        totalTicketsSold += soldTickets;
        totalTicketsAvailable += ticketType.quantity - soldTickets;
      }
    }

    // Get recent events with proper typing
    const recentEvents = await Event.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name date status createdAt')
      .lean<LeanEvent[]>();

    return NextResponse.json({
      success: true,
      statistics: {
        totalEvents,
        activeEvents,
        completedEvents,
        cancelledEvents,
        totalRevenue,
        totalTicketsSold,
        totalTicketsAvailable,
        recentEvents: recentEvents.map(event => ({
          _id: event._id.toString(),
          name: event.name,
          date: event.date,
          status: event.status,
          createdAt: event.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('❌ Get events statistics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events statistics' },
      { status: 500 }
    );
  }
}