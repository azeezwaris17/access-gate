// app/api/v1/events/[eventId]/delete-event/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/app/api/v1/models/Event';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get token
const getToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

// Helper function to verify event ownership
const verifyEventOwnership = async (eventId: string, adminId: string) => {
  console.log('🔍 Searching for event to delete:', { eventId, adminId });
  
  const event = await Event.findOne({ _id: eventId });
  console.log('📋 Event found for deletion:', event ? 'YES' : 'NO');
  
  if (!event) {
    throw new Error('Event not found');
  }
  
  if (event.adminId.toString() !== adminId) {
    throw new Error('Access denied');
  }
  
  return event;
};

export async function DELETE(
  request: NextRequest
) {
  try {
    // Extract eventId from the URL manually
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventId = pathSegments[pathSegments.length - 2]; // Get the segment before "delete-event"
    
    console.log('🔍 Manual eventId extraction for deletion:', eventId);
    console.log('🔍 Full URL:', request.url);
    console.log('🔍 Path segments:', pathSegments);
    
    if (!eventId || eventId === '[eventId]' || eventId === 'delete-event') {
      console.error('❌ Failed to extract eventId from URL for deletion');
      return NextResponse.json(
        { error: 'Invalid event ID in URL' },
        { status: 400 }
      );
    }

    // Database connection error
    try {
      await connectDB();
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Authentication error - No token
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    // Authentication error - Invalid token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      console.error('❌ Token verification error:', tokenError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Authentication error - No admin ID in token
    if (!decoded?.adminId) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    // Event ownership verification error
    try {
      await verifyEventOwnership(eventId, decoded.adminId);
    } catch (ownershipError) {
      const errorMessage = ownershipError instanceof Error ? ownershipError.message : 'Event access denied';
      
      // Separate 404 for event not found
      if (errorMessage === 'Event not found') {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }
      
      // Separate 403 for access denied
      if (errorMessage === 'Access denied') {
        return NextResponse.json(
          { error: 'You do not have permission to delete this event' },
          { status: 403 }
        );
      }
      
      throw ownershipError;
    }

    // Delete the event
    const result = await Event.deleteOne({ _id: eventId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error: unknown) {
    console.error('❌ Delete event error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete event';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}