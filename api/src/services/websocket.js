// ============================================
// PROJECT ZERO-TOUCH - WEBSOCKET SERVER
// Real-time updates for dashboard
// ============================================

import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import { eventBus, Events } from './event-bus.js';

let wss = null;
const clients = new Set();

/**
 * Initialize WebSocket server
 */
export function initWebSocket(server) {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        const clientId = Date.now().toString(36);
        clients.add(ws);

        logger.info(`WebSocket client connected: ${clientId}`, {
            totalClients: clients.size
        });

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            clientId,
            timestamp: new Date().toISOString()
        }));

        // Handle messages from clients
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                handleClientMessage(ws, data);
            } catch (error) {
                logger.error('Invalid WebSocket message', { error: error.message });
            }
        });

        // Handle client disconnect
        ws.on('close', () => {
            clients.delete(ws);
            logger.info(`WebSocket client disconnected: ${clientId}`, {
                totalClients: clients.size
            });
        });

        ws.on('error', (error) => {
            logger.error(`WebSocket error: ${clientId}`, { error: error.message });
            clients.delete(ws);
        });
    });

    // Subscribe to internal events and broadcast to clients
    subscribeToEvents();

    logger.info('WebSocket server initialized');
    return wss;
}

/**
 * Handle messages from clients
 */
function handleClientMessage(ws, data) {
    switch (data.type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

        case 'subscribe':
            // Could implement channel-based subscriptions
            ws.send(JSON.stringify({
                type: 'subscribed',
                channels: data.channels || ['all']
            }));
            break;

        default:
            logger.debug('Unknown WebSocket message type', { type: data.type });
    }
}

/**
 * Subscribe to event bus and broadcast to WebSocket clients
 */
function subscribeToEvents() {
    // Lead events
    eventBus.subscribe(Events.LEAD_NEW, (data) => {
        broadcast({
            type: 'lead:new',
            data,
            timestamp: new Date().toISOString()
        });
    });

    eventBus.subscribe(Events.LEAD_STATUS_CHANGED, (data) => {
        broadcast({
            type: 'lead:status_changed',
            data,
            timestamp: new Date().toISOString()
        });
    });

    // Agent events
    eventBus.subscribe(Events.AGENT_SPAWNED, (data) => {
        broadcast({
            type: 'agent:spawned',
            data,
            timestamp: new Date().toISOString()
        });
    });

    // Communication events
    eventBus.subscribe(Events.MESSAGE_SENT, (data) => {
        broadcast({
            type: 'message:sent',
            data,
            timestamp: new Date().toISOString()
        });
    });

    eventBus.subscribe(Events.VOICE_CALL_STARTED, (data) => {
        broadcast({
            type: 'voice:call_started',
            data,
            timestamp: new Date().toISOString()
        });
    });

    // Contract events
    eventBus.subscribe(Events.CONTRACT_SENT, (data) => {
        broadcast({
            type: 'contract:sent',
            data,
            timestamp: new Date().toISOString()
        });
    });

    eventBus.subscribe(Events.SIGNATURE_COMPLETED, (data) => {
        broadcast({
            type: 'signature:completed',
            data,
            timestamp: new Date().toISOString()
        });
    });

    // Payment events
    eventBus.subscribe(Events.PAYMENT_RECEIVED, (data) => {
        broadcast({
            type: 'payment:received',
            data,
            timestamp: new Date().toISOString()
        });
    });

    // System events
    eventBus.subscribe(Events.SYSTEM_ERROR, (data) => {
        broadcast({
            type: 'system:error',
            data,
            timestamp: new Date().toISOString()
        });
    });
}

/**
 * Broadcast message to all connected clients
 */
export function broadcast(message) {
    const messageStr = JSON.stringify(message);

    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

/**
 * Send message to specific client
 */
export function sendToClient(clientId, message) {
    // Would need to track clients by ID
    // For now, just broadcast
    broadcast(message);
}

/**
 * Get connected client count
 */
export function getClientCount() {
    return clients.size;
}

export default {
    init: initWebSocket,
    broadcast,
    getClientCount
};
