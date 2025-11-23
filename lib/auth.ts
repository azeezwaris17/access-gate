import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_KEY_SECRET = process.env.ADMIN_KEY_SECRET || 'admin-secret-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(adminId: string): string {
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { adminId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };
    return decoded;
  } catch {
    return null;
  }
}

export function generateRegistrationKey(): string {
  const parts = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 4; i++) {
    let part = '';
    for (let j = 0; j < 4; j++) {
      part += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(part);
  }
  return parts.join('-');
}

export function generateTicketToken(ticketId: string, eventId: string): string {
  // Generate a HMAC-based token for ticket validation
  const data = `${ticketId}:${eventId}:${Date.now()}`;
  const hash = crypto
    .createHmac('sha256', ADMIN_KEY_SECRET)
    .update(data)
    .digest('hex');
  return `${data}:${hash}`;
}

export function validateTicketToken(token: string): { ticketId: string; eventId: string } | null {
  try {
    const [ticketId, eventId, timestamp, hash] = token.split(':');
    const data = `${ticketId}:${eventId}:${timestamp}`;
    const expectedHash = crypto
      .createHmac('sha256', ADMIN_KEY_SECRET)
      .update(data)
      .digest('hex');
    
    if (hash === expectedHash) {
      return { ticketId, eventId };
    }
    return null;
  } catch {
    return null;
  }
}