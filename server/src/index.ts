import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import passport from 'passport';

import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { initializeSocket } from './config/socket';
import { configurePassport } from './config/passport';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import routeRoutes from './routes/route.routes';
import stopRoutes from './routes/stop.routes';
import busRoutes from './routes/bus.routes';
import tripRoutes from './routes/trip.routes';
import reminderRoutes from './routes/reminder.routes';
import adminRoutes from './routes/admin.routes';

import { errorHandler } from './middleware/error.middleware';
import { startLocationFlushJob } from './jobs/flushLocations';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Passport
configurePassport(passport);
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected');

    // Connect to Redis
    await connectRedis();
    console.log('✅ Redis connected');

    // Initialize Socket.io with Redis adapter
    initializeSocket(server);
    console.log('✅ Socket.io initialized with Redis adapter');

    // Start background jobs
    startLocationFlushJob();
    console.log('✅ Location flush job started');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, server };
