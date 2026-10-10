require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const connectDB = require('./config/db');

app.use(cors({
  origin: [
    'https://cargo-realm-logistics.netlify.app',
    'https://cargorealmandlogistics.com',
    'https://www.cargorealmandlogistics.com',
    'http://cargorealmandlogistics.com',
    'http://www.cargorealmandlogistics.com',
    'https://cargo-realm-logistics.vercel.app',
    'http://localhost:5173'
  ], // Your frontend URLs
  credentials: true, // Allow cookies/auth headers to be sent
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Explicitly allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Explicitly allowed headers
  optionsSuccessStatus: 200, // Status for preflight requests
}));

// Fix for large base64 uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.send('Welcome to Cargo Realm and Logistics!');
});

// Ensure MongoDB is connected before handling any request (needed on serverless,
// where each cold start begins without a connection)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ message: 'Database unavailable. Please try again.' });
  }
});

// Register all routes after app is initialized
app.use('/api/test', require('./routes/testRoutes'));
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/contact', require('./routes/contactFormRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/prayer-requests', require('./routes/prayerRequestRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/shipments', require('./routes/shipmentRoutes'));
app.use('/api/messageslides', require('./routes/meesageslidesRoutes'));
app.use('/api/facilities', require('./routes/facilityRoutes'));
app.use('/api/shipment-statuses', require('./routes/shipmentStatusRoutes'));
app.use('/api/hero', require('./routes/heroRoutes'));
app.use('/api/services', require('./routes/servicesRoutes'));
app.use('/api/messageslides', require('./routes/meesageslidesRoutes'));
app.use('/api/sms', require('./routes/smsRoutes'));

// Only start a listener when run directly (local dev / Render).
// On Vercel the app is imported by api/index.js instead.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
