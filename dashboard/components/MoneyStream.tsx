"use client";

import { Lead, PIPELINE_COLUMNS } from "@/lib/types";
import { LeadCard } from "./LeadCard";

interface MoneyStreamProps {
    leads: Record<string, Lead[]>;
}

export function MoneyStream({ leads }: MoneyStreamProps) {
    return (
        <div className="mt-6">
            {/* Money flow animation bar */}
            <div className="relative h-2 bg-zinc-800 rounded-full mb-6 overflow-hidden">
                <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-money-flow"
                    style={{ width: "40%" }}
                />
            </div>

            {/* Pipeline columns */}
            <div className="grid grid-cols-5 gap-4">
                {PIPELINE_COLUMNS.map((column) => (
                    <div
                        key={column.id}
                        className="pipeline-column"
                    >
                        {/* Column header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{column.icon}</span>
                                <h3 className="font-semibold text-sm">{column.title}</h3>
                            </div>
                            <span
                                className="text-xs font-bold px-2 py-1 rounded-full"
                                style={{
                                    backgroundColor: `${column.color}20`,
                                    color: column.color
                                }}
                            >
                                {leads[column.id]?.length || 0}
                            </span>
                        </div>

                        {/* Leads */}
                        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-350px)] pr-1">
                            {leads[column.id]?.map((lead, index) => (
                                <LeadCard
                                    key={lead.id}
                                    lead={lead}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                />
                            ))}

                            {(!leads[column.id] || leads[column.id].length === 0) && (
                                <div className="text-center py-8 text-zinc-600 text-sm">
                                    No leads
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
