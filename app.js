require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

app.use(cors({
  origin: [
    'https://caclightway.netlify.app',
    'https://caclightway.com',
    'http://caclightway.com',
    'http://localhost:5173'
  ], // Your frontend URLs
  credentials: true, // Allow cookies/auth headers to be sent
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'], // Explicitly allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Explicitly allowed headers
  optionsSuccessStatus: 204, // Status for preflight requests
}));

// Fix for large base64 uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Register all routes after app is initialized
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/contact', require('./routes/contactFormRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/prayer-requests', require('./routes/prayerRequestRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));

app.get('/', (req, res) => {
  res.send('Welcome to CAC Lightway Backend!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
