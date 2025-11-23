// app/api/events/create-event/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/app/api/v1/models/Event';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get token
const getToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

// POST - Create new event
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

    const eventData = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'date', 'time', 'location', 'description', 'ticketTypes'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate ticket types
    if (!Array.isArray(eventData.ticketTypes) || eventData.ticketTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one ticket type is required' },
        { status: 400 }
      );
    }

    // Validate each ticket type
    for (const ticketType of eventData.ticketTypes) {
      if (!ticketType.name || !ticketType.price || !ticketType.quantity) {
        return NextResponse.json(
          { error: 'Each ticket type must have name, price, and quantity' },
          { status: 400 }
        );
      }
    }

    // Create new event
    const event = new Event({
      ...eventData,
      adminId: decoded.adminId,
      status: 'active'
    });

    await event.save();

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event: {
        _id: event._id,
        name: event.name,
        date: event.date,
        time: event.time,
        location: event.location,
        status: event.status
      }
    });
  } catch (error) {
    console.error('❌ Create event error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}