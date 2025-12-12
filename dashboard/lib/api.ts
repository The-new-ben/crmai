// ============================================
// PROJECT ZERO-TOUCH - API CLIENT
// Connects dashboard to backend API
// ============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * Dashboard Stats API
 */
export const statsApi = {
    async getStats() {
        return apiFetch<{
            success: boolean;
            data: {
                incoming: number;
                processing: number;
                negotiating: number;
                contract_sent: number;
                paid: number;
                lost: number;
                total_revenue: number;
            };
        }>('/api/dashboard/stats');
    },
};

/**
 * Leads API
 */
export const leadsApi = {
    async getByStatus(status: string, limit = 50) {
        return apiFetch<{
            success: boolean;
            data: Array<{
                id: string;
                contact_name: string;
                contact_phone: string;
                contact_email: string;
                detected_intent: string;
                detected_urgency: number;
                estimated_value: number;
                required_persona: string;
                business_vertical: string;
                status: string;
                primary_language: string;
                created_at: string;
                updated_at: string;
            }>;
        }>(`/api/dashboard/leads/${status}?limit=${limit}`);
    },

    async getById(id: string) {
        return apiFetch<{
            success: boolean;
            data: any;
        }>(`/api/leads/${id}`);
    },

    async getNegotiationHistory(leadId: string) {
        return apiFetch<{
            success: boolean;
            data: Array<{
                id: string;
                channel: string;
                direction: string;
                message_content: string;
                ai_response: string;
                detected_sentiment: number;
                created_at: string;
            }>;
        }>(`/api/leads/${leadId}/negotiations`);
    },
};

/**
 * System Control API
 */
export const systemApi = {
    async emergencyStop() {
        return apiFetch<{ success: boolean; message: string }>(
            '/api/system/emergency-stop',
            { method: 'POST' }
        );
    },

    async resume() {
        return apiFetch<{ success: boolean; message: string }>(
            '/api/system/resume',
            { method: 'POST' }
        );
    },

    async getHealth() {
        return apiFetch<{
            status: string;
            timestamp: string;
            version: string;
            services: Record<string, string>;
        }>('/health');
    },
};

/**
 * Ingest API (for testing)
 */
export const ingestApi = {
    async sendLead(data: any, sourceChannel = 'web') {
        return apiFetch<{
            success: boolean;
            leadId: string;
            requestId: string;
            classification: {
                intent: string;
                urgency: number;
                persona: string;
                language: string;
            };
        }>('/api/ingest', {
            method: 'POST',
            headers: {
                'X-Source-Channel': sourceChannel,
            },
            body: JSON.stringify(data),
        });
    },
};

export default {
    stats: statsApi,
    leads: leadsApi,
    system: systemApi,
    ingest: ingestApi,
};
