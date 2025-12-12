"use client";

import { useEffect, useRef, useState } from "react";

interface ActivityItem {
    id: string;
    type: "lead_new" | "message_sent" | "call_started" | "contract_sent" | "payment_received" | "agent_action";
    title: string;
    description: string;
    timestamp: Date;
    leadId?: string;
}

export function ActivityFeed() {
    const [activities, setActivities] = useState<ActivityItem[]>([
        {
            id: "1",
            type: "lead_new",
            title: "New lead received",
            description: "John Smith from WhatsApp",
            timestamp: new Date(Date.now() - 2 * 60000)
        },
        {
            id: "2",
            type: "agent_action",
            title: "Shark agent spawned",
            description: "Assigned to legal case",
            timestamp: new Date(Date.now() - 5 * 60000)
        },
        {
            id: "3",
            type: "message_sent",
            title: "WhatsApp sent",
            description: "Intro message to Sarah Davis",
            timestamp: new Date(Date.now() - 8 * 60000)
        },
        {
            id: "4",
            type: "call_started",
            title: "Voice call initiated",
            description: "Follow-up call to Michael Chen",
            timestamp: new Date(Date.now() - 15 * 60000)
        },
        {
            id: "5",
            type: "contract_sent",
            title: "Contract sent",
            description: "DocuSign to Robert Johnson",
            timestamp: new Date(Date.now() - 25 * 60000)
        },
        {
            id: "6",
            type: "payment_received",
            title: "Payment received",
            description: "$45,000 from Jennifer Martinez",
            timestamp: new Date(Date.now() - 45 * 60000)
        }
    ]);

    const feedRef = useRef<HTMLDivElement>(null);

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            const types: ActivityItem["type"][] = ["lead_new", "message_sent", "agent_action"];
            const randomType = types[Math.floor(Math.random() * types.length)];

            const newActivity: ActivityItem = {
                id: Date.now().toString(),
                type: randomType,
                title: getRandomTitle(randomType),
                description: getRandomDescription(randomType),
                timestamp: new Date()
            };

            setActivities(prev => [newActivity, ...prev].slice(0, 20));
        }, 15000); // Add new activity every 15 seconds

        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: ActivityItem["type"]) => {
        const icons = {
            lead_new: "📥",
            message_sent: "💬",
            call_started: "📞",
            contract_sent: "📄",
            payment_received: "💰",
            agent_action: "🤖"
        };
        return icons[type];
    };

    const getColor = (type: ActivityItem["type"]) => {
        const colors = {
            lead_new: "border-blue-500",
            message_sent: "border-purple-500",
            call_started: "border-yellow-500",
            contract_sent: "border-orange-500",
            payment_received: "border-green-500",
            agent_action: "border-cyan-500"
        };
        return colors[type];
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="glass rounded-xl p-4 h-full">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Activity
            </h3>

            <div
                ref={feedRef}
                className="space-y-3 overflow-y-auto max-h-[300px] pr-2"
            >
                {activities.map((activity, index) => (
                    <div
                        key={activity.id}
                        className={`flex gap-3 pl-3 border-l-2 ${getColor(activity.type)} ${index === 0 ? 'animate-slide-up' : ''}`}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span>{getIcon(activity.type)}</span>
                                <span className="text-sm font-medium truncate">{activity.title}</span>
                            </div>
                            <p className="text-xs text-zinc-500 truncate">{activity.description}</p>
                        </div>
                        <span className="text-xs text-zinc-600 whitespace-nowrap">
                            {formatTime(activity.timestamp)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getRandomTitle(type: ActivityItem["type"]): string {
    const titles = {
        lead_new: ["New lead received", "Lead captured", "Incoming inquiry"],
        message_sent: ["WhatsApp sent", "Email delivered", "SMS sent"],
        call_started: ["Voice call initiated", "Outbound call", "Follow-up call"],
        contract_sent: ["Contract sent", "DocuSign sent", "Agreement delivered"],
        payment_received: ["Payment received", "Invoice paid", "Funds received"],
        agent_action: ["Agent spawned", "Persona switched", "Escalation triggered"]
    };
    const options = titles[type];
    return options[Math.floor(Math.random() * options.length)];
}

function getRandomDescription(type: ActivityItem["type"]): string {
    const names = ["David", "Sarah", "Michael", "Emma", "John", "Lisa", "יוסי", "דנה"];
    const name = names[Math.floor(Math.random() * names.length)];

    const descriptions = {
        lead_new: `${name} via WhatsApp`,
        message_sent: `Outreach to ${name}`,
        call_started: `Calling ${name}`,
        contract_sent: `Agreement for ${name}`,
        payment_received: `$${(Math.random() * 50000 + 5000).toFixed(0)} from ${name}`,
        agent_action: `Shark handling ${name}'s case`
    };
    return descriptions[type];
}
