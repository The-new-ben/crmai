// ============================================
// PROJECT ZERO-TOUCH - PROVIDER MANAGER
// Manages provider instances and health checks
// ============================================

import { db, providersDb } from './database.js';
import { logger } from '../utils/logger.js';
import { ProviderRegistry, getProvider } from '../providers/index.js';

/**
 * Provider Manager - singleton that manages all provider instances
 */
class ProviderManager {
    constructor() {
        this.providers = new Map();
        this.healthCheckInterval = null;
    }

    /**
     * Initialize all configured providers
     */
    async initialize() {
        try {
            // Get all active providers from database
            const result = await db.query(`
        SELECT * FROM provider_configurations 
        WHERE is_active = TRUE
        ORDER BY provider_type, is_default DESC
      `);

            for (const config of result.rows) {
                try {
                    await this.initializeProvider(config);
                } catch (error) {
                    logger.error(`Failed to initialize provider ${config.provider_name}`, {
                        error: error.message
                    });
                }
            }

            // Start health checks
            this.startHealthChecks();

            logger.info(`Provider manager initialized with ${this.providers.size} providers`);
        } catch (error) {
            logger.error('Failed to initialize provider manager', { error: error.message });
        }
    }

    /**
     * Initialize a single provider
     */
    async initializeProvider(config) {
        const key = `${config.provider_type}:${config.provider_name}`;

        const provider = getProvider(config.provider_type, config.provider_name, {
            ...config.config,
            ...config
        });

        await provider.initialize();

        this.providers.set(key, {
            instance: provider,
            config,
            isDefault: config.is_default,
            lastHealthCheck: null,
            isHealthy: true
        });

        logger.debug(`Provider initialized: ${key}`);
    }

    /**
     * Get provider instance by type and name
     */
    get(type, name = null) {
        if (name) {
            const key = `${type}:${name}`;
            return this.providers.get(key)?.instance;
        }

        // Get default provider for type
        for (const [key, data] of this.providers) {
            if (key.startsWith(`${type}:`) && data.isDefault) {
                return data.instance;
            }
        }

        // Return first available of type
        for (const [key, data] of this.providers) {
            if (key.startsWith(`${type}:`)) {
                return data.instance;
            }
        }

        return null;
    }

    /**
     * Get all providers of a type
     */
    getAllOfType(type) {
        const result = [];
        for (const [key, data] of this.providers) {
            if (key.startsWith(`${type}:`)) {
                result.push(data);
            }
        }
        return result;
    }

    /**
     * Switch default provider
     */
    async setDefault(type, name) {
        // Update database
        await db.query(`
      UPDATE provider_configurations 
      SET is_default = FALSE 
      WHERE provider_type = $1
    `, [type]);

        await db.query(`
      UPDATE provider_configurations 
      SET is_default = TRUE 
      WHERE provider_type = $1 AND provider_name = $2
    `, [type, name]);

        // Update in-memory state
        for (const [key, data] of this.providers) {
            if (key.startsWith(`${type}:`)) {
                data.isDefault = key === `${type}:${name}`;
            }
        }

        logger.info(`Default provider for ${type} changed to ${name}`);
    }

    /**
     * Start periodic health checks
     */
    startHealthChecks() {
        // Check every 5 minutes
        this.healthCheckInterval = setInterval(
            () => this.runHealthChecks(),
            5 * 60 * 1000
        );

        // Run initial check
        this.runHealthChecks();
    }

    /**
     * Run health checks on all providers
     */
    async runHealthChecks() {
        logger.debug('Running provider health checks');

        for (const [key, data] of this.providers) {
            try {
                const isHealthy = await data.instance.healthCheck();
                data.isHealthy = isHealthy;
                data.lastHealthCheck = new Date();

                // Update database
                await providersDb.updateHealth(
                    data.config.id,
                    isHealthy ? 'healthy' : 'unhealthy'
                );

                if (!isHealthy) {
                    logger.warn(`Provider unhealthy: ${key}`);
                }
            } catch (error) {
                data.isHealthy = false;
                data.lastHealthCheck = new Date();
                logger.error(`Health check failed for ${key}`, { error: error.message });
            }
        }
    }

    /**
     * Get health status of all providers
     */
    getHealthStatus() {
        const status = {};

        for (const [key, data] of this.providers) {
            const [type, name] = key.split(':');

            if (!status[type]) {
                status[type] = {};
            }

            status[type][name] = {
                healthy: data.isHealthy,
                default: data.isDefault,
                lastCheck: data.lastHealthCheck
            };
        }

        return status;
    }

    /**
     * Shutdown all providers
     */
    async shutdown() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        for (const [key, data] of this.providers) {
            try {
                if (data.instance.shutdown) {
                    await data.instance.shutdown();
                }
            } catch (error) {
                logger.error(`Error shutting down ${key}`, { error: error.message });
            }
        }

        this.providers.clear();
        logger.info('Provider manager shutdown complete');
    }
}

// Singleton instance
export const providerManager = new ProviderManager();

// Convenience functions
export const getVoiceProvider = (name) => providerManager.get('voice', name);
export const getMessagingProvider = (name) => providerManager.get('messaging', name);
export const getEmailProvider = (name) => providerManager.get('email', name);
export const getSignatureProvider = (name) => providerManager.get('esignature', name);
export const getPaymentProvider = (name) => providerManager.get('payment', name);

export default providerManager;
