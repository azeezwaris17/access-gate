// app/api/events/analytics/route.ts
import { connectDB } from '@/lib/db';
import { Event, IEvent, ITicketType } from '@/app/api/v1/models/Event';
import { Ticket } from '@/app/api/v1/models/Ticket';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

interface EventAnalytics {
  name: string;
  ticketCount: number;
  checkedIn: number;
  revenue: number;
  checkInRate: number;
}

interface RecentCheckIn {
  attendeeName: string;
  eventName: string;
  checkedInAt: Date;
  ticketType: string;
}

interface AnalyticsResponse {
  totalEvents: number;
  totalTickets: number;
  validTickets: number;
  checkedInTickets: number;
  revokedTickets: number;
  totalRevenue: number;
  eventAnalytics: EventAnalytics[];
  recentCheckIns: RecentCheckIn[];
}

// Helper type for the populated result
type TicketWithPopulatedEvent = Omit<InstanceType<typeof Ticket>, 'eventId'> & {
  eventId: IEvent;
};

export async function GET(request: NextRequest) {
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

    const adminId = new mongoose.Types.ObjectId(decoded.adminId);

    // Get all events for this admin
    const events = await Event.find({ adminId });
    
    let totalEvents = 0;
    let totalTickets = 0;
    let validTickets = 0;
    let checkedInTickets = 0;
    let revokedTickets = 0;
    let totalRevenue = 0;
    const eventAnalytics: EventAnalytics[] = [];
    const recentCheckIns: RecentCheckIn[] = [];

    // Calculate analytics for each event
    for (const event of events) {
      const eventTickets = await Ticket.find({ eventId: event._id.toString() });
      
      const eventTicketCount = eventTickets.length;
      const eventCheckedIn = eventTickets.filter(t => t.status === 'checked-in').length;
      const eventValid = eventTickets.filter(t => t.status === 'valid').length;
      const eventRevoked = eventTickets.filter(t => t.status === 'revoked').length;
      
      // Calculate revenue for this event
      let eventRevenue = 0;
      for (const ticketType of event.ticketTypes) {
        const typeTickets = eventTickets.filter(t => t.ticketTypeId === ticketType._id?.toString());
        eventRevenue += typeTickets.length * ticketType.price;
      }

      eventAnalytics.push({
        name: event.name,
        ticketCount: eventTicketCount,
        checkedIn: eventCheckedIn,
        revenue: eventRevenue,
        checkInRate: eventTicketCount > 0 ? Math.round((eventCheckedIn / eventTicketCount) * 100) : 0
      });

      totalEvents++;
      totalTickets += eventTicketCount;
      checkedInTickets += eventCheckedIn;
      validTickets += eventValid;
      revokedTickets += eventRevoked;
      totalRevenue += eventRevenue;
    }

    // Get recent check-ins (last 10)
    const recentTickets = await Ticket.find({ 
      status: 'checked-in',
      checkedInAt: { $exists: true }
    })
    .populate<{ eventId: IEvent }>('eventId')
    .sort({ checkedInAt: -1 })
    .limit(10)
    .lean() as unknown as TicketWithPopulatedEvent[];

    for (const ticket of recentTickets) {
      const event = ticket.eventId;
      if (event) {
        const ticketType = event.ticketTypes.find((type: ITicketType) => 
          type._id?.toString() === ticket.ticketTypeId
        );
        
        if (ticket.checkedInAt) {
          recentCheckIns.push({
            attendeeName: ticket.attendeeName,
            eventName: event.name,
            checkedInAt: ticket.checkedInAt,
            ticketType: ticketType?.name || 'Unknown'
          });
        }
      }
    }

    const analytics: AnalyticsResponse = {
      totalEvents,
      totalTickets,
      validTickets,
      checkedInTickets,
      revokedTickets,
      totalRevenue,
      eventAnalytics,
      recentCheckIns
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}