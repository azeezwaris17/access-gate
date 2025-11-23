// app/api/v1/events/[eventId]/update-event-status/route.ts
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
  console.log('🔍 Searching for event:', { eventId, adminId });
  
  const event = await Event.findOne({ _id: eventId });
  console.log('📋 Event found:', event ? 'YES' : 'NO');
  
  if (!event) {
    throw new Error('Event not found');
  }
  
  if (event.adminId.toString() !== adminId) {
    throw new Error('Access denied');
  }
  
  return event;
};

export async function PATCH(
  request: NextRequest
) {
  try {
    // Extract eventId from the URL manually
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventId = pathSegments[pathSegments.length - 2]; // Get the segment before "update-event-status"
    
    console.log('🔍 Manual eventId extraction:', eventId);
    console.log('🔍 Full URL:', request.url);
    console.log('🔍 Path segments:', pathSegments);
    
    if (!eventId || eventId === '[eventId]' || eventId === 'update-event-status') {
      console.error('❌ Failed to extract eventId from URL');
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
    let event;
    try {
      event = await verifyEventOwnership(eventId, decoded.adminId);
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
          { error: 'You do not have permission to access this event' },
          { status: 403 }
        );
      }
      
      throw ownershipError;
    }

    // Request body parsing error
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { status } = requestBody;

    // Validation error - Missing status
    if (!status) {
      return NextResponse.json(
        { error: 'Status field is required' },
        { status: 400 }
      );
    }

    // Validation error - Invalid status value
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be active, completed, or cancelled' },
        { status: 400 }
      );
    }

    // Database update error
    try {
      event.status = status;
      await event.save();
    } catch (updateError) {
      console.error('❌ Event update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update event status' },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: `Event status updated to ${status}`,
      event: {
        _id: event._id,
        name: event.name,
        status: event.status
      }
    });

  } catch (error: unknown) {
    // Generic server error
    console.error('❌ Unexpected server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}