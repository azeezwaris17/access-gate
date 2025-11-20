// /api/events/public/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '../../models/Event';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    
    // Get active events (not cancelled and future dates)
    const currentDate = new Date();
    const events = await Event.find({
      status: { $ne: 'cancelled' },
      date: { $gte: currentDate }
    }).select('name date time location description ticketTypes');

    return NextResponse.json(events);
  } catch (error) {
    console.error('Fetch public events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}