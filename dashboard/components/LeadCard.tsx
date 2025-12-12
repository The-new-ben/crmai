"use client";

import { Lead, PERSONA_ICONS, PERSONA_COLORS, PersonaType } from "@/lib/types";
import { CSSProperties } from "react";

interface LeadCardProps {
    lead: Lead;
    style?: CSSProperties;
}

export function LeadCard({ lead, style }: LeadCardProps) {
    const getUrgencyColor = (urgency: number) => {
        if (urgency >= 8) return "#ef4444";
        if (urgency >= 5) return "#fbbf24";
        return "#22c55e";
    };

    const formatValue = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        return `$${value}`;
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    const persona = lead.required_persona as PersonaType;
    const isHebrew = lead.primary_language === "he";

    return (
        <div
            className="lead-card animate-slide-up"
            style={style}
            dir={isHebrew ? "rtl" : "ltr"}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                        {lead.contact_name || "Unknown"}
                    </h4>
                    <p className="text-xs text-zinc-500 truncate">
                        {lead.contact_phone || lead.contact_email || "No contact"}
                    </p>
                </div>

                {/* Urgency indicator */}
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                        backgroundColor: `${getUrgencyColor(lead.detected_urgency)}20`,
                        color: getUrgencyColor(lead.detected_urgency)
                    }}
                >
                    {lead.detected_urgency}
                </div>
            </div>

            {/* Intent & Vertical */}
            <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
                    {lead.detected_intent}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
                    {lead.business_vertical.replace("_", " ")}
                </span>
            </div>

            {/* Value & Persona row */}
            <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-green-400">
                    {formatValue(lead.estimated_value)}
                </span>

                {persona && (
                    <div
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                        style={{
                            backgroundColor: `${PERSONA_COLORS[persona]}20`,
                            color: PERSONA_COLORS[persona]
                        }}
                    >
                        <span>{PERSONA_ICONS[persona]}</span>
                        <span className="capitalize">{persona}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
                <span className="text-xs text-zinc-600">
                    {isHebrew ? "🇮🇱" : "🇺🇸"} {lead.primary_language.toUpperCase()}
                </span>
                <span className="text-xs text-zinc-600">
                    {getTimeAgo(lead.created_at)}
                </span>
            </div>
        </div>
    );
}
