"use client";

import { useState } from "react";

interface TestLeadFormProps {
    onSubmit: (data: any) => Promise<void>;
    isLoading?: boolean;
}

export function TestLeadForm({ onSubmit, isLoading }: TestLeadFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        message: "",
        language: "en",
        channel: "web"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await onSubmit({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            message: formData.message,
            language: formData.language
        });

        // Reset form
        setFormData({
            name: "",
            phone: "",
            email: "",
            message: "",
            language: "en",
            channel: "web"
        });
        setIsOpen(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-110 transition-transform"
                title="Send Test Lead"
            >
                <span className="text-2xl">➕</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            {/* Form Modal */}
            <div className="relative glass rounded-2xl w-full max-w-md p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Send Test Lead</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                                placeholder="+1234567890"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Message</label>
                        <textarea
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                            rows={3}
                            placeholder="I'm interested in buying a property..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Language</label>
                            <select
                                value={formData.language}
                                onChange={e => setFormData({ ...formData, language: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                            >
                                <option value="en">🇺🇸 English</option>
                                <option value="he">🇮🇱 Hebrew</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Channel</label>
                            <select
                                value={formData.channel}
                                onChange={e => setFormData({ ...formData, channel: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                            >
                                <option value="web">🌐 Web</option>
                                <option value="whatsapp">💬 WhatsApp</option>
                                <option value="email">📧 Email</option>
                                <option value="voice">📞 Voice</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            "🚀 Send Lead to System"
                        )}
                    </button>
                </form>

                <p className="text-xs text-zinc-600 mt-4 text-center">
                    This will create a real lead and trigger the AI agents
                </p>
            </div>
        </div>
    );
}
