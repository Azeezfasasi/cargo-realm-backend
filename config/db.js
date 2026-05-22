const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    console.log(`✓ MongoDB connected to ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('✗ MongoDB connection failed:');
    console.error(err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('  → Check MongoDB cluster is running and IP whitelist includes your IP');
    }
    if (err.message.includes('authentication failed')) {
      console.error('  → Check MONGO_URI credentials in .env');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
