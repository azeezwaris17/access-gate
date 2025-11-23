// app/api/events/search-event/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/app/api/v1/models/Event';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { FilterQuery, Types } from 'mongoose';

// Type definitions
interface EventDocument {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  name: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

// Type for lean event result
interface LeanEvent {
  _id: Types.ObjectId;
  name: string;
  date: Date;
  time: string;
  location: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

// Helper function to get token
const getToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

// GET - Search events
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Build search filter
    const filter: FilterQuery<EventDocument> = { 
      adminId: new mongoose.Types.ObjectId(decoded.adminId),
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ] as FilterQuery<EventDocument>['$or']
    };

    // Search events
    const events = await Event.find(filter)
      .select('_id name date time location status')
      .sort({ date: 1, createdAt: -1 })
      .limit(limit)
      .lean<LeanEvent[]>();

    const formattedEvents = events.map(event => ({
      _id: event._id.toString(),
      name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      status: event.status
    }));

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      total: events.length
    });
  } catch (error) {
    console.error('❌ Search events error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search events' },
      { status: 500 }
    );
  }
}