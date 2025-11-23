import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/accessgate';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not defined');
  throw new Error('MONGODB_URI environment variable is not defined');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('✅ Using cached database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔄 Creating new database connection...');
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      console.log('✅ Database connected successfully');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error('❌ Database connection failed:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

declare global {
  var mongoose: MongooseCache;
}