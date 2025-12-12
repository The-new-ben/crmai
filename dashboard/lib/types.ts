export interface Lead {
    id: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    detected_intent: string;
    detected_urgency: number;
    estimated_value: number;
    required_persona?: string;
    business_vertical: string;
    status?: string;
    primary_language: string;
    created_at: string;
    updated_at?: string;
}

export interface DashboardStats {
    incoming: number;
    processing: number;
    negotiating: number;
    contract_sent: number;
    paid: number;
    lost: number;
    total_revenue: number;
}

export interface PipelineColumn {
    id: string;
    title: string;
    status: string;
    color: string;
    icon: string;
}

export const PIPELINE_COLUMNS: PipelineColumn[] = [
    { id: "incoming", title: "Incoming", status: "incoming", color: "#60a5fa", icon: "📥" },
    { id: "processing", title: "AI Processing", status: "processing", color: "#a78bfa", icon: "🤖" },
    { id: "negotiating", title: "Negotiating", status: "negotiating", color: "#fbbf24", icon: "💬" },
    { id: "contract_sent", title: "Contract Sent", status: "contract_sent", color: "#f97316", icon: "📄" },
    { id: "paid", title: "PAID", status: "paid", color: "#22c55e", icon: "💰" }
];

export type PersonaType = "shark" | "empath" | "concierge" | "professional" | "closer";

export const PERSONA_ICONS: Record<PersonaType, string> = {
    shark: "🦈",
    empath: "💗",
    concierge: "🎩",
    professional: "👔",
    closer: "🎯"
};

export const PERSONA_COLORS: Record<PersonaType, string> = {
    shark: "#ef4444",
    empath: "#ec4899",
    concierge: "#8b5cf6",
    professional: "#3b82f6",
    closer: "#22c55e"
};
