// ============================================
// PROJECT ZERO-TOUCH - API SERVER
// Main entry point
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import webhookRoutes from './routes/webhook.js';
import { db } from './services/database.js';
import { eventBus, Events } from './services/event-bus.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false // Disable for API
}));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Source-Channel', 'X-Source-Id', 'X-Source-Provider']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });

    next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', async (req, res) => {
    const dbHealthy = await db.healthCheck();

    res.json({
        status: dbHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
            database: dbHealthy ? 'up' : 'down'
        }
    });
});

// API routes
app.use('/api', webhookRoutes);

// Dashboard data endpoint (for frontend)
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'incoming') as incoming,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'negotiating') as negotiating,
        COUNT(*) FILTER (WHERE status = 'contract_sent') as contract_sent,
        COUNT(*) FILTER (WHERE status = 'paid') as paid,
        COUNT(*) FILTER (WHERE status = 'lost') as lost,
        SUM(CASE WHEN status = 'paid' THEN estimated_value ELSE 0 END) as total_revenue
      FROM universal_leads_ledger
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

        res.json({
            success: true,
            data: stats.rows[0]
        });
    } catch (error) {
        logger.error('Dashboard stats error', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

// Get leads by status (for dashboard columns)
app.get('/api/dashboard/leads/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const leads = await db.query(`
      SELECT 
        id, contact_name, contact_phone, contact_email,
        detected_intent, detected_urgency, estimated_value,
        required_persona, business_vertical, status,
        primary_language, created_at, updated_at
      FROM universal_leads_ledger
      WHERE status = $1
      ORDER BY 
        CASE WHEN detected_urgency >= 8 THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT $2
    `, [status, limit]);

        res.json({
            success: true,
            data: leads.rows
        });
    } catch (error) {
        logger.error('Dashboard leads error', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to fetch leads' });
    }
});

// Emergency stop endpoint
app.post('/api/system/emergency-stop', async (req, res) => {
    try {
        // Emit emergency stop event
        eventBus.emit(Events.SYSTEM_ERROR, {
            type: 'emergency_stop',
            triggeredBy: req.ip,
            timestamp: new Date().toISOString()
        });

        // In production, this would:
        // 1. Stop all outbound communications
        // 2. Pause all agents
        // 3. Alert administrators

        logger.warn('EMERGENCY STOP TRIGGERED', { ip: req.ip });

        res.json({
            success: true,
            message: 'Emergency stop activated. All agents paused.'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Resume system
app.post('/api/system/resume', async (req, res) => {
    try {
        logger.info('System resumed', { ip: req.ip });

        res.json({
            success: true,
            message: 'System resumed. Agents reactivated.'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// START SERVER
// ============================================

async function start() {
    try {
        // Verify database connection
        const dbConnected = await db.healthCheck();
        if (!dbConnected) {
            logger.warn('Database not connected. Some features may be unavailable.');
        }

        app.listen(PORT, () => {
            logger.info(`🚀 Zero-Touch API running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error: error.message });
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    await db.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    await db.close();
    process.exit(0);
});

start();

export default app;
