const mongoose = require('mongoose');

// Cache the connection across invocations so serverless (Vercel) instances
// reuse one connection instead of opening a new one per request.
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`✓ MongoDB connected to ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (err) {
    // Reset so the next request retries instead of reusing a failed promise
    cached.promise = null;
    console.error('✗ MongoDB connection failed:');
    console.error(err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('  → Check MongoDB cluster is running and IP whitelist includes your IP');
    }
    if (err.message.includes('authentication failed')) {
      console.error('  → Check MONGO_URI credentials in .env');
    }
    throw err;
  }
};

module.exports = connectDB;
