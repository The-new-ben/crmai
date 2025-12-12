"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";

interface LeadDetailModalProps {
    lead: Lead;
    isOpen: boolean;
    onClose: () => void;
}

export function LeadDetailModal({ lead, isOpen, onClose }: LeadDetailModalProps) {
    const [activeTab, setActiveTab] = useState<"info" | "history" | "actions">("info");

    if (!isOpen) return null;

    const formatValue = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative glass rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold">{lead.contact_name || 'Unknown Lead'}</h2>
                        <p className="text-sm text-zinc-500">{lead.contact_phone || lead.contact_email}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800">
                    {(["info", "history", "actions"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors
                ${activeTab === tab
                                    ? 'text-blue-400 border-b-2 border-blue-400'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {tab === "info" && "📋 Info"}
                            {tab === "history" && "💬 History"}
                            {tab === "actions" && "⚡ Actions"}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[400px]">
                    {activeTab === "info" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <InfoItem label="Intent" value={lead.detected_intent} />
                                <InfoItem label="Urgency" value={`${lead.detected_urgency}/10`} />
                                <InfoItem label="Value" value={formatValue(lead.estimated_value)} />
                                <InfoItem label="Vertical" value={lead.business_vertical} />
                                <InfoItem label="Persona" value={lead.required_persona || 'Auto'} />
                                <InfoItem label="Language" value={lead.primary_language.toUpperCase()} />
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                                <p className="text-xs text-zinc-500 mb-2">Created</p>
                                <p className="text-sm">{formatDate(lead.created_at)}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === "history" && (
                        <div className="space-y-4">
                            <p className="text-sm text-zinc-500">Conversation history will appear here when connected to the API.</p>

                            {/* Mock history */}
                            <div className="space-y-3">
                                <HistoryItem
                                    direction="outbound"
                                    channel="whatsapp"
                                    content="Hello! I noticed your inquiry about our services. How can I help you today?"
                                    time="2 hours ago"
                                />
                                <HistoryItem
                                    direction="inbound"
                                    channel="whatsapp"
                                    content="Hi, I'm interested in learning more about your real estate services."
                                    time="1 hour ago"
                                />
                                <HistoryItem
                                    direction="outbound"
                                    channel="whatsapp"
                                    content="Wonderful! I'd be happy to assist. Are you looking to buy or sell?"
                                    time="45 min ago"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "actions" && (
                        <div className="space-y-4">
                            <p className="text-sm text-zinc-500 mb-4">Manual actions (override automation)</p>

                            <div className="grid grid-cols-2 gap-3">
                                <ActionButton icon="📞" label="Trigger Voice Call" />
                                <ActionButton icon="💬" label="Send WhatsApp" />
                                <ActionButton icon="📧" label="Send Email" />
                                <ActionButton icon="📄" label="Generate Contract" />
                                <ActionButton icon="👤" label="Change Persona" />
                                <ActionButton icon="⏸️" label="Pause Lead" />
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                                <button className="w-full py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                                    🚫 Mark as Lost
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className="text-sm font-medium capitalize">{value}</p>
        </div>
    );
}

function HistoryItem({
    direction,
    channel,
    content,
    time
}: {
    direction: "inbound" | "outbound";
    channel: string;
    content: string;
    time: string;
}) {
    return (
        <div className={`flex gap-3 ${direction === 'outbound' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-1 p-3 rounded-lg ${direction === 'outbound'
                    ? 'bg-blue-500/20 text-blue-100'
                    : 'bg-zinc-800 text-zinc-200'
                }`}>
                <p className="text-sm">{content}</p>
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                    <span>{channel === 'whatsapp' ? '💬' : channel === 'voice' ? '📞' : '📧'}</span>
                    <span>{time}</span>
                </p>
            </div>
        </div>
    );
}

function ActionButton({ icon, label }: { icon: string; label: string }) {
    return (
        <button className="flex items-center gap-2 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm">
            <span>{icon}</span>
            <span>{label}</span>
        </button>
    );
}
