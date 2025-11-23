// app/api/auth/register/route.ts
import { connectDB } from '@/lib/db';
import { Admin } from '@/app/api/v1/models/Admin';
import { hashPassword, generateToken, } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { fullName, email, password, registrationKey } = await request.json();

    // Validate input
    if (!fullName || !email || !password || !registrationKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Validate registration key (in production, verify against allowed keys)
    // For now, accept any key format
    if (!registrationKey.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
      return NextResponse.json(
        { error: 'Invalid registration key format' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin
    const admin = new Admin({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      registrationKeys: [{
        key: registrationKey,
        usedAt: new Date(),
        usedBy: email.toLowerCase(),
      }],
    });

    await admin.save();

    // Generate token
    const token = generateToken(admin._id.toString());

    return NextResponse.json({
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
