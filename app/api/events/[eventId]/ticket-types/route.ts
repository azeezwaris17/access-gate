// /api/tickets/[eventId]/ticket-types/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/models/Event';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
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

    const { eventId } = await params;
    const ticketTypes = await request.json();

    if (!Array.isArray(ticketTypes) || ticketTypes.length === 0) {
      return NextResponse.json(
        { error: 'Ticket types array is required' },
        { status: 400 }
      );
    }

    // Verify event exists and belongs to admin
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Update event with ticket types
    event.ticketTypes = ticketTypes;
    await event.save();

    return NextResponse.json({ 
      message: 'Ticket types created successfully',
      event 
    }, { status: 201 });
  } catch (error) {
    console.error('Create ticket types error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket types' },
      { status: 500 }
    );
  }
}