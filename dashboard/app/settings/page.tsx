"use client";

import { useState } from "react";
import Link from "next/link";

interface ProviderConfig {
    name: string;
    displayName: string;
    type: string;
    isDefault: boolean;
    isActive: boolean;
    status: "healthy" | "unhealthy" | "unknown";
}

const mockProviders: ProviderConfig[] = [
    { name: "vapi", displayName: "Vapi AI", type: "voice", isDefault: true, isActive: true, status: "healthy" },
    { name: "twilio", displayName: "Twilio Voice", type: "voice", isDefault: false, isActive: true, status: "healthy" },
    { name: "whatsapp_business", displayName: "WhatsApp Business", type: "messaging", isDefault: true, isActive: true, status: "healthy" },
    { name: "sendgrid", displayName: "SendGrid", type: "email", isDefault: true, isActive: true, status: "healthy" },
    { name: "docusign", displayName: "DocuSign", type: "esignature", isDefault: true, isActive: true, status: "unknown" },
    { name: "stripe", displayName: "Stripe", type: "payment", isDefault: true, isActive: true, status: "healthy" },
];

const mockPersonas = [
    { codeName: "shark", name: "The Shark", type: "negotiator", isActive: true },
    { codeName: "empath", name: "The Empath", type: "support", isActive: true },
    { codeName: "concierge", name: "The Concierge", type: "sales", isActive: true },
    { codeName: "professional", name: "The Professional", type: "sales", isActive: true },
    { codeName: "closer", name: "The Closer", type: "sales", isActive: true },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"providers" | "personas" | "system">("providers");
    const [providers, setProviders] = useState(mockProviders);
    const [notification, setNotification] = useState<string | null>(null);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSetDefault = (type: string, name: string) => {
        setProviders(prev => prev.map(p => ({
            ...p,
            isDefault: p.type === type ? p.name === name : p.isDefault
        })));
        showNotification(`✅ ${name} is now the default ${type} provider`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "healthy": return "bg-green-500";
            case "unhealthy": return "bg-red-500";
            default: return "bg-zinc-500";
        }
    };

    return (
        <main className="min-h-screen p-6">
            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-6 right-6 z-50 glass rounded-lg px-4 py-3 animate-slide-up shadow-lg">
                    {notification}
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-sm text-zinc-500 mt-1">Configure providers, personas, and system settings</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {(["providers", "personas", "system"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize
              ${activeTab === tab
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 border border-transparent'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="glass rounded-2xl p-6">
                {activeTab === "providers" && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">External Providers</h2>
                        <p className="text-sm text-zinc-500 mb-6">
                            Configure and switch between different service providers. All providers are modular and can be swapped without code changes.
                        </p>

                        {/* Group by type */}
                        {["voice", "messaging", "email", "esignature", "payment"].map(type => (
                            <div key={type} className="mb-6">
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">{type}</h3>
                                <div className="grid gap-3">
                                    {providers.filter(p => p.type === type).map(provider => (
                                        <div
                                            key={provider.name}
                                            className={`flex items-center justify-between p-4 rounded-lg border ${provider.isDefault ? 'border-blue-500/50 bg-blue-500/10' : 'border-zinc-800 bg-zinc-800/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(provider.status)}`} />
                                                <div>
                                                    <p className="font-medium">{provider.displayName}</p>
                                                    <p className="text-xs text-zinc-500">{provider.name}</p>
                                                </div>
                                                {provider.isDefault && (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Default</span>
                                                )}
                                            </div>
                                            {!provider.isDefault && (
                                                <button
                                                    onClick={() => handleSetDefault(type, provider.name)}
                                                    className="text-sm px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
                                                >
                                                    Set as Default
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "personas" && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Agent Personas</h2>
                        <p className="text-sm text-zinc-500 mb-6">
                            Configure AI agent personas and their behavior. Each persona has unique prompts and characteristics.
                        </p>

                        <div className="grid gap-3">
                            {mockPersonas.map(persona => (
                                <div
                                    key={persona.codeName}
                                    className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-800/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {persona.codeName === 'shark' && '🦈'}
                                            {persona.codeName === 'empath' && '💗'}
                                            {persona.codeName === 'concierge' && '🎩'}
                                            {persona.codeName === 'professional' && '👔'}
                                            {persona.codeName === 'closer' && '🎯'}
                                        </span>
                                        <div>
                                            <p className="font-medium">{persona.name}</p>
                                            <p className="text-xs text-zinc-500">{persona.type}</p>
                                        </div>
                                        {persona.isActive && (
                                            <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">Active</span>
                                        )}
                                    </div>
                                    <button className="text-sm px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors">
                                        Edit Prompt
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "system" && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">System Settings</h2>

                        <div className="space-y-6">
                            {/* Language */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Primary Language</label>
                                <select className="w-full max-w-xs px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500">
                                    <option value="en">🇺🇸 English</option>
                                    <option value="he">🇮🇱 Hebrew</option>
                                </select>
                            </div>

                            {/* Auto-improvement */}
                            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800">
                                <div>
                                    <p className="font-medium">Self-Improvement (The Improver)</p>
                                    <p className="text-sm text-zinc-500">Daily analysis of lost leads to improve prompts</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>

                            {/* Response Delay */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Response Delay (simulated human behavior)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="30"
                                        max="300"
                                        defaultValue="120"
                                        className="flex-1"
                                    />
                                    <span className="text-sm text-zinc-400 w-20">120 sec</span>
                                </div>
                            </div>

                            {/* Database Stats */}
                            <div className="p-4 rounded-lg border border-zinc-800">
                                <p className="font-medium mb-3">Database Statistics</p>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-blue-400">1,234</p>
                                        <p className="text-xs text-zinc-500">Total Leads</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-green-400">5,678</p>
                                        <p className="text-xs text-zinc-500">Negotiations</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-purple-400">42</p>
                                        <p className="text-xs text-zinc-500">Ontology Rules</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
