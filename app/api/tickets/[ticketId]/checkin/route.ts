// /api/tickets/[ticketId]/checkin/route.ts
import { connectDB } from '@/lib/db';
import { Ticket } from '@/models/Ticket';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      {
        status: 'checked-in',
        checkedInAt: new Date(),
      },
      { new: true }
    );

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Check-in failed' },
      { status: 500 }
    );
  }
}
