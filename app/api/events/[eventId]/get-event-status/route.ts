// app/api/events/[eventId]/get-event-status/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/app/api/models/Event';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const eventId = params.id;
    const { status } = await request.json();

    // Validate status
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be active, completed, or cancelled' },
        { status: 400 }
      );
    }

    // Find event and verify ownership
    const event = await Event.findOne({ 
      _id: eventId, 
      adminId: decoded.adminId 
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    // Update event status
    event.status = status;
    await event.save();

    console.log(`✅ Updated event ${eventId} status to ${status}`);

    return NextResponse.json({
      success: true,
      message: `Event status updated to ${status}`,
      event: {
        _id: event._id,
        name: event.name,
        status: event.status,
        date: event.date,
        time: event.time,
        location: event.location
      }
    });

  } catch (error) {
    console.error('❌ Update event status error:', error);
    return NextResponse.json(
      { error: 'Failed to update event status' },
      { status: 500 }
    );
  }
}