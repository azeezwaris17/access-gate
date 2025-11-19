// /api/tickets/[eventId]/create-ticket/route.ts
import { connectDB } from '@/lib/db';
import { Ticket } from '@/models/Ticket';
import { Event } from '@/models/Event';
import { generateQRCode } from '@/lib/qrcode';
import { sendTicketEmail } from '@/lib/email';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

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

    const body = await request.json();
    const { eventId, ticketTypeId, attendeeName, attendeeEmail } = body;

    if (!eventId || !ticketTypeId || !attendeeName || !attendeeEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify event exists and belongs to admin
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Generate unique ticket code
    const ticketCode = `AG-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Generate QR code
    const qrCode = await generateQRCode(ticketCode);

    // Create ticket
    const ticket = new Ticket({
      eventId,
      ticketTypeId,
      attendeeName,
      attendeeEmail,
      ticketCode,
      qrCode,
    });

    await ticket.save();

    // Send welcome email with ticket
    await sendTicketEmail(attendeeEmail, attendeeName, event.name, ticketCode, qrCode);

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
