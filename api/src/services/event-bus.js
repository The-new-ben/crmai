// ============================================
// PROJECT ZERO-TOUCH - EVENT BUS
// Internal event system for agent coordination
// ============================================

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100);
        this.history = [];
        this.historyLimit = 1000;
    }

    /**
     * Emit an event with logging
     */
    emit(event, data) {
        logger.debug(`Event emitted: ${event}`, { data });

        // Store in history
        this.history.push({
            event,
            data,
            timestamp: new Date().toISOString()
        });

        // Trim history if needed
        if (this.history.length > this.historyLimit) {
            this.history = this.history.slice(-this.historyLimit);
        }

        return super.emit(event, data);
    }

    /**
     * Subscribe to an event with error handling
     */
    subscribe(event, handler) {
        const wrappedHandler = async (data) => {
            try {
                await handler(data);
            } catch (error) {
                logger.error(`Event handler error for ${event}`, {
                    error: error.message,
                    stack: error.stack
                });
            }
        };

        this.on(event, wrappedHandler);
        return () => this.off(event, wrappedHandler);
    }

    /**
     * Get recent events
     */
    getHistory(limit = 100) {
        return this.history.slice(-limit);
    }

    /**
     * Get events by type
     */
    getHistoryByType(eventType, limit = 50) {
        return this.history
            .filter(e => e.event === eventType)
            .slice(-limit);
    }
}

// Singleton instance
export const eventBus = new EventBus();

// ============================================
// EVENT TYPES
// ============================================

export const Events = {
    // Lead events
    LEAD_NEW: 'lead:new',
    LEAD_UPDATED: 'lead:updated',
    LEAD_STATUS_CHANGED: 'lead:status_changed',
    LEAD_ASSIGNED: 'lead:assigned',

    // Agent events
    AGENT_SPAWNED: 'agent:spawned',
    AGENT_COMPLETED: 'agent:completed',
    AGENT_ESCALATED: 'agent:escalated',

    // Communication events
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_READ: 'message:read',

    // Voice events
    VOICE_CALL_STARTED: 'voice:call_started',
    VOICE_TRANSCRIPT: 'voice:transcript',
    VOICE_CALL_ENDED: 'voice:call_ended',

    // Contract events
    CONTRACT_GENERATED: 'contract:generated',
    CONTRACT_SENT: 'contract:sent',
    SIGNATURE_COMPLETED: 'signature:completed',

    // Payment events
    INVOICE_SENT: 'invoice:sent',
    PAYMENT_RECEIVED: 'payment:received',

    // System events
    SYSTEM_ERROR: 'system:error',
    SYSTEM_HEALTH_CHECK: 'system:health_check',
    IMPROVEMENT_TRIGGERED: 'improvement:triggered'
};

export default eventBus;
