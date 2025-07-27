import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client with service role key for backend operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import route modules
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activity.js';
import usersRoutes from './routes/users.js';
import servicesRoutes from './routes/services.js';
import analyticsRoutes from './routes/analytics.js';
import appUsersRoutes from './routes/app-users.js';
import profilesRoutes from './routes/profiles.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/app-users', appUsersRoutes);
app.use('/api/profiles', profilesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Backend server running with Supabase integration',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
    
    if (error) throw error;
    
    res.json({ 
      status: 'Database connected successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ 
      status: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🗄️  Using Supabase database`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});