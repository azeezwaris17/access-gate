// app/api/admin/keys/route.ts
import { connectDB } from '@/lib/db';
import { Admin } from '@/app/api/v1/models/Admin';
import { verifyToken, generateRegistrationKey } from '@/lib/auth';
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

    const newKey = generateRegistrationKey();

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      {
        $push: {
          registrationKeys: {
            key: newKey,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      key: newKey,
      allKeys: admin.registrationKeys,
    });
  } catch (error) {
    console.error('Key generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate key' },
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

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      keys: admin.registrationKeys,
    });
  } catch (error) {
    console.error('Fetch keys error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keys' },
      { status: 500 }
    );
  }
}
