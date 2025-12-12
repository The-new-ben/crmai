// ============================================
// PROJECT ZERO-TOUCH - DATABASE SERVICE
// PostgreSQL connection with connection pooling
// ============================================

import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

// Connection pool configuration
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'zerotouch',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Log pool events
pool.on('connect', () => {
    logger.debug('New database connection established');
});

pool.on('error', (err) => {
    logger.error('Unexpected database error', { error: err.message });
});

/**
 * Database interface
 */
export const db = {
    /**
     * Execute a query with parameters
     */
    async query(text, params = []) {
        const start = Date.now();
        try {
            const result = await pool.query(text, params);
            const duration = Date.now() - start;

            logger.debug('Query executed', {
                query: text.substring(0, 100),
                duration: `${duration}ms`,
                rows: result.rowCount
            });

            return result;
        } catch (error) {
            logger.error('Query failed', {
                query: text.substring(0, 100),
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Get a single row by ID
     */
    async getById(table, id) {
        const result = await this.query(
            `SELECT * FROM ${table} WHERE id = $1`,
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Insert and return the new row
     */
    async insert(table, data) {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.query(
            `INSERT INTO ${table} (${columns.join(', ')}) 
       VALUES (${placeholders}) 
       RETURNING *`,
            values
        );
        return result.rows[0];
    },

    /**
     * Update a row by ID
     */
    async updateById(table, id, data) {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');

        const result = await this.query(
            `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        return result.rows[0];
    },

    /**
     * Transaction helper
     */
    async transaction(callback) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Health check
     */
    async healthCheck() {
        try {
            await this.query('SELECT 1');
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Close the pool
     */
    async close() {
        await pool.end();
    }
};

// ============================================
// SPECIALIZED QUERIES
// ============================================

/**
 * Lead-specific database operations
 */
export const leadsDb = {
    async getById(id) {
        return db.getById('universal_leads_ledger', id);
    },

    async updateStatus(id, status, reason = null) {
        return db.query(
            `UPDATE universal_leads_ledger 
       SET status = $2, status_reason = $3, updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
            [id, status, reason]
        );
    },

    async getByStatus(status, limit = 100) {
        const result = await db.query(
            `SELECT * FROM universal_leads_ledger 
       WHERE status = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
            [status, limit]
        );
        return result.rows;
    },

    async getRecentLost(hours = 24) {
        const result = await db.query(
            `SELECT * FROM universal_leads_ledger 
       WHERE status = 'lost' 
       AND updated_at > NOW() - INTERVAL '${hours} hours'
       ORDER BY updated_at DESC`
        );
        return result.rows;
    },

    async assignAgent(leadId, agentId) {
        return db.query(
            `UPDATE universal_leads_ledger 
       SET assigned_agent_id = $2, updated_at = NOW() 
       WHERE id = $1`,
            [leadId, agentId]
        );
    }
};

/**
 * Negotiation log operations
 */
export const negotiationsDb = {
    async create(data) {
        return db.insert('autonomous_negotiation_logs', data);
    },

    async getByLeadId(leadId) {
        const result = await db.query(
            `SELECT * FROM autonomous_negotiation_logs 
       WHERE lead_id = $1 
       ORDER BY created_at ASC`,
            [leadId]
        );
        return result.rows;
    },

    async getLastSentiment(leadId) {
        const result = await db.query(
            `SELECT detected_sentiment FROM autonomous_negotiation_logs 
       WHERE lead_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
            [leadId]
        );
        return result.rows[0]?.detected_sentiment || null;
    }
};

/**
 * Provider configuration operations
 */
export const providersDb = {
    async getDefault(type) {
        const result = await db.query(
            `SELECT * FROM provider_configurations 
       WHERE provider_type = $1 AND is_default = TRUE AND is_active = TRUE
       LIMIT 1`,
            [type]
        );
        return result.rows[0];
    },

    async getByName(type, name) {
        const result = await db.query(
            `SELECT * FROM provider_configurations 
       WHERE provider_type = $1 AND provider_name = $2 AND is_active = TRUE
       LIMIT 1`,
            [type, name]
        );
        return result.rows[0];
    },

    async updateHealth(id, status) {
        return db.query(
            `UPDATE provider_configurations 
       SET health_status = $2, last_health_check = NOW() 
       WHERE id = $1`,
            [id, status]
        );
    }
};

/**
 * Agent persona operations
 */
export const personasDb = {
    async getByCodeName(codeName) {
        const result = await db.query(
            `SELECT * FROM agent_personas 
       WHERE code_name = $1 AND is_active = TRUE
       LIMIT 1`,
            [codeName]
        );
        return result.rows[0];
    },

    async getAll() {
        const result = await db.query(
            `SELECT * FROM agent_personas WHERE is_active = TRUE ORDER BY name`
        );
        return result.rows;
    }
};

/**
 * Ontology rules operations
 */
export const ontologyDb = {
    async getActiveRules() {
        const result = await db.query(
            `SELECT * FROM dynamic_ontology_map 
       WHERE is_active = TRUE 
       ORDER BY priority DESC`
        );
        return result.rows;
    },

    async incrementTriggerCount(ruleId, success = false) {
        const successIncrement = success ? 1 : 0;
        return db.query(
            `UPDATE dynamic_ontology_map 
       SET times_triggered = times_triggered + 1,
           success_count = success_count + $2,
           last_triggered_at = NOW()
       WHERE id = $1`,
            [ruleId, successIncrement]
        );
    }
};

export default db;
