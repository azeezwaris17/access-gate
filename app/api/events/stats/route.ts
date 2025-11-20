// /api/events/stats/route.ts
import { connectDB } from '@/lib/db';
import { Ticket } from '@/app/api/models/Ticket';
import { Event } from '@/app/api/models/Event';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

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

    const adminId = decoded.adminId;

    // Get total events
    const totalEvents = await Event.countDocuments({ adminId });

    // Get ticket statistics
    const tickets = await Ticket.find({}).populate('eventId');
    const adminTickets = tickets.filter((t: any) => t.eventId?.adminId?.toString() === adminId);

    const totalTickets = adminTickets.length;
    const validTickets = adminTickets.filter((t: any) => t.status === 'valid').length;
    const checkedInTickets = adminTickets.filter((t: any) => t.status === 'checked-in').length;
    const revokedTickets = adminTickets.filter((t: any) => t.status === 'revoked').length;

    // Get revenue (sum of all ticket prices)
    const events = await Event.find({ adminId });
    let totalRevenue = 0;
    events.forEach((event: any) => {
      event.ticketTypes.forEach((type: any) => {
        const ticketsOfType = adminTickets.filter(
          (t: any) => t.eventId._id.toString() === event._id.toString() && t.ticketTypeId === type.name
        );
        totalRevenue += ticketsOfType.length * type.price;
      });
    });

    // Get event details with ticket counts
    const eventStats = await Promise.all(
      events.map(async (event: any) => {
        const eventTickets = adminTickets.filter((t: any) => t.eventId._id.toString() === event._id.toString());
        return {
          id: event._id,
          name: event.name,
          date: event.date,
          ticketCount: eventTickets.length,
          checkedIn: eventTickets.filter((t: any) => t.status === 'checked-in').length,
        };
      })
    );

    return NextResponse.json({
      totalEvents,
      totalTickets,
      validTickets,
      checkedInTickets,
      revokedTickets,
      totalRevenue,
      eventStats,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
