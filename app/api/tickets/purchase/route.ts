// /api/tickets/purchase/route.ts
import { connectDB } from '@/lib/db';
import { Ticket } from '../../models/Ticket';
import { Event, ITicketType } from '../../models/Event';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

function generateTicketCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

interface PurchaseRequest {
  eventId: string;
  ticketTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
}

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectDB();
    const { eventId, ticketTypeId, attendeeName, attendeeEmail }: PurchaseRequest = await request.json();

    if (!eventId || !ticketTypeId || !attendeeName || !attendeeEmail) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify event exists and get ticket type details WITH session for transaction
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Find the ticket type with proper typing
    const ticketType = event.ticketTypes.find((type: ITicketType) => 
      type._id?.toString() === ticketTypeId
    );

    if (!ticketType) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Ticket type not found' },
        { status: 404 }
      );
    }

    // Check if ticket type has available quantity
    const soldTicketsCount = await Ticket.countDocuments({
      eventId,
      ticketTypeId: ticketTypeId
    }).session(session);

    if (soldTicketsCount >= ticketType.quantity) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'This ticket type is sold out' },
        { status: 400 }
      );
    }

    // Generate unique ticket code
    let ticketCode: string;
    let isUnique = false;
    
    while (!isUnique) {
      ticketCode = generateTicketCode();
      const existingTicket = await Ticket.findOne({ ticketCode }).session(session);
      if (!existingTicket) {
        isUnique = true;
      }
    }

    // Create ticket WITH session
    const ticket = new Ticket({
      eventId,
      ticketTypeId,
      attendeeName,
      attendeeEmail,
      ticketCode: ticketCode!,
      status: 'valid',
    });

    await ticket.save({ session });

    // Update the sold count for the ticket type
    // Since we're using a simple quantity field, we don't need to decrement it
    // The sold count is calculated dynamically from Ticket collection
    // But we can add a "sold" field to track it if needed
    
    // Alternative approach: If you want to track sold count in the Event document:
    // Find the index of the ticket type in the array
    const ticketTypeIndex = event.ticketTypes.findIndex((type: ITicketType) => 
      type._id?.toString() === ticketTypeId
    );

    if (ticketTypeIndex !== -1) {
      // Initialize sold field if it doesn't exist
      if (!event.ticketTypes[ticketTypeIndex].sold) {
        event.ticketTypes[ticketTypeIndex].sold = 0;
      }
      
      // Increment sold count
      event.ticketTypes[ticketTypeIndex].sold += 1;
      
      // Save the updated event WITH session
      await event.save({ session });
    }

    // Commit the transaction
    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      ticket: {
        _id: ticket._id,
        ticketCode: ticket.ticketCode,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        status: ticket.status,
        event: {
          name: event.name,
          date: event.date,
          time: event.time,
          location: event.location
        },
        ticketType: ticketType.name,
        price: ticketType.price
      },
      message: 'Ticket purchased successfully!',
      availableTickets: ticketType.quantity - (soldTicketsCount + 1) // Updated available count
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    console.error('Ticket purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase ticket' },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}