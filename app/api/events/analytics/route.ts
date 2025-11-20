// /api/events/analytics/route.ts
import { connectDB } from '@/lib/db';
import { Event } from '@/app/api/models/Event';
import { Ticket } from '@/app/api/models/Ticket';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

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

    const adminId = new mongoose.Types.ObjectId(decoded.adminId);
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') as string || '30d';

    const { startDate, endDate } = getDateRange(timeRange);

    // OPTIMIZED: Run queries in parallel with simpler aggregations
    const [
      totalEvents,
      totalTickets,
      validTickets,
      checkedInTickets,
      revokedTickets,
      revenueResult,
      eventAnalytics
    ] = await Promise.all([
      // Total events count
      Event.countDocuments({ 
        adminId,
        createdAt: { $gte: startDate, $lte: endDate }
      }),

      // Total tickets count
      Ticket.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),

      // Valid tickets count
      Ticket.countDocuments({
        status: 'valid',
        createdAt: { $gte: startDate, $lte: endDate }
      }),

      // Checked-in tickets count
      Ticket.countDocuments({
        status: 'checked-in',
        createdAt: { $gte: startDate, $lte: endDate }
      }),

      // Revoked tickets count
      Ticket.countDocuments({
        status: 'revoked',
        createdAt: { $gte: startDate, $lte: endDate }
      }),

      // SIMPLIFIED: Total revenue calculation
      Ticket.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['valid', 'checked-in'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$price' } // Assuming price is stored directly in Ticket model
          }
        }
      ]),

      // SIMPLIFIED: Event analytics with less complex pipeline
      Event.aggregate([
        {
          $match: {
            adminId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $lookup: {
            from: 'tickets',
            localField: '_id',
            foreignField: 'eventId',
            as: 'tickets'
          }
        },
        {
          $project: {
            name: 1,
            totalTickets: { $size: '$tickets' },
            checkedInTickets: {
              $size: {
                $filter: {
                  input: '$tickets',
                  as: 'ticket',
                  cond: { $eq: ['$$ticket.status', 'checked-in'] }
                }
              }
            },
            // Simplified revenue calculation
            revenue: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$tickets',
                      as: 'ticket',
                      cond: { $in: ['$$ticket.status', ['valid', 'checked-in']] }
                    }
                  },
                  as: 'ticket',
                  in: '$$ticket.price'
                }
              }
            }
          }
        },
        {
          $sort: { totalTickets: -1 }
        },
        {
          $limit: 8 // Reduced from 10 to 8 for better performance
        }
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const analytics = {
      totalEvents,
      totalTickets,
      validTickets,
      checkedInTickets,
      revokedTickets,
      totalRevenue,
      eventAnalytics
    };

    console.log(`✅ Fetched optimized dashboard analytics for admin ${decoded.adminId}`);
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('❌ Get dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}