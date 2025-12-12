// ============================================
// PROJECT ZERO-TOUCH - PROVIDERS API ROUTES
// Endpoints for provider management
// ============================================

import express from 'express';
import { db, providersDb } from '../services/database.js';
import { providerManager } from '../services/provider-manager.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Get all providers
 */
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
      SELECT * FROM provider_configurations 
      ORDER BY provider_type, is_default DESC, provider_name
    `);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        logger.error('Error fetching providers', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to fetch providers' });
    }
});

/**
 * Get providers by type
 */
router.get('/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const result = await db.query(`
      SELECT * FROM provider_configurations 
      WHERE provider_type = $1
      ORDER BY is_default DESC, provider_name
    `, [type]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        logger.error('Error fetching providers by type', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to fetch providers' });
    }
});

/**
 * Set default provider for a type
 */
router.post('/default', async (req, res) => {
    try {
        const { type, name } = req.body;

        if (!type || !name) {
            return res.status(400).json({ success: false, error: 'Type and name are required' });
        }

        await providerManager.setDefault(type, name);

        res.json({ success: true, message: `${name} is now the default ${type} provider` });
    } catch (error) {
        logger.error('Error setting default provider', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to set default provider' });
    }
});

/**
 * Get provider health status
 */
router.get('/health', async (req, res) => {
    try {
        const health = providerManager.getHealthStatus();
        res.json({ success: true, data: health });
    } catch (error) {
        logger.error('Error fetching provider health', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to fetch health status' });
    }
});

/**
 * Trigger health check for all providers
 */
router.post('/health/check', async (req, res) => {
    try {
        await providerManager.runHealthChecks();
        const health = providerManager.getHealthStatus();
        res.json({ success: true, data: health });
    } catch (error) {
        logger.error('Error running health checks', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to run health checks' });
    }
});

/**
 * Update provider configuration
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { config, isActive } = req.body;

        const updates = [];
        const params = [id];
        let paramIndex = 2;

        if (config !== undefined) {
            updates.push(`config = $${paramIndex++}`);
            params.push(JSON.stringify(config));
        }

        if (isActive !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            params.push(isActive);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No updates provided' });
        }

        const result = await db.query(`
      UPDATE provider_configurations 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Provider not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        logger.error('Error updating provider', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to update provider' });
    }
});

export default router;
