"use client";

import { useEffect, useState } from "react";

interface SystemHealthProps {
    apiUrl?: string;
}

interface HealthData {
    status: "healthy" | "degraded" | "offline";
    services: {
        database: string;
        agents: string;
        voice: string;
        messaging: string;
    };
    uptime: string;
    lastCheck: string;
}

export function SystemHealth({ apiUrl = "http://localhost:3001" }: SystemHealthProps) {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch(`${apiUrl}/health`);
                if (response.ok) {
                    const data = await response.json();
                    setHealth({
                        status: data.status,
                        services: {
                            database: data.services?.database || "unknown",
                            agents: "up", // Mock for now
                            voice: "up",
                            messaging: "up"
                        },
                        uptime: data.uptime || "N/A",
                        lastCheck: new Date().toLocaleTimeString()
                    });
                } else {
                    setHealth({
                        status: "degraded",
                        services: { database: "down", agents: "unknown", voice: "unknown", messaging: "unknown" },
                        uptime: "N/A",
                        lastCheck: new Date().toLocaleTimeString()
                    });
                }
            } catch {
                setHealth({
                    status: "offline",
                    services: { database: "down", agents: "down", voice: "down", messaging: "down" },
                    uptime: "N/A",
                    lastCheck: new Date().toLocaleTimeString()
                });
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [apiUrl]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "healthy":
            case "up":
                return "bg-green-500";
            case "degraded":
                return "bg-yellow-500";
            default:
                return "bg-red-500";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy":
            case "up":
                return "✓";
            case "degraded":
                return "!";
            default:
                return "✕";
        }
    };

    if (!health) {
        return (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
                Checking system...
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
                <div className={`w-2 h-2 rounded-full ${getStatusColor(health.status)} ${health.status === 'healthy' ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-zinc-400 capitalize">{health.status}</span>
                <span className="text-xs text-zinc-600">▼</span>
            </button>

            {isExpanded && (
                <div className="absolute top-full right-0 mt-2 w-64 glass rounded-xl p-4 animate-slide-up z-50">
                    <h3 className="text-sm font-semibold mb-3">System Health</h3>

                    <div className="space-y-2">
                        {Object.entries(health.services).map(([service, status]) => (
                            <div key={service} className="flex items-center justify-between">
                                <span className="text-xs text-zinc-400 capitalize">{service}</span>
                                <div className="flex items-center gap-1">
                                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${getStatusColor(status)}`}>
                                        {getStatusIcon(status)}
                                    </span>
                                    <span className="text-xs text-zinc-500 capitalize">{status}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800">
                        <p className="text-xs text-zinc-600">
                            Last check: {health.lastCheck}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
