// /api/events/create-event/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/models/Event';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function getAdminId(request: NextRequest): string | null {
  const token = getToken(request);
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.adminId || null;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const adminId = getAdminId(request);
    
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, date, time, location, description, ticketTypes } = await request.json();

    const event = new Event({
      adminId,
      name,
      date: new Date(date),
      time,
      location,
      description,
      ticketTypes,
    });

    await event.save();

    return NextResponse.json(event);
  } catch (error) {
    console.error('Event creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const adminId = getAdminId(request);
    
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await Event.find({ adminId });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Fetch events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
