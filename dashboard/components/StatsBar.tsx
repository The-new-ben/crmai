"use client";

import { DashboardStats } from "@/lib/types";

interface StatsBarProps {
    stats: DashboardStats;
}

export function StatsBar({ stats }: StatsBarProps) {
    const formatRevenue = (value: number) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(2)}M`;
        }
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value}`;
    };

    const totalLeads = stats.incoming + stats.processing + stats.negotiating + stats.contract_sent + stats.paid;
    const conversionRate = totalLeads > 0 ? ((stats.paid / (stats.paid + stats.lost)) * 100).toFixed(1) : "0";

    return (
        <div className="glass rounded-2xl p-6">
            <div className="grid grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="col-span-2 lg:col-span-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Revenue (30d)</p>
                    <p className="money-counter">{formatRevenue(stats.total_revenue)}</p>
                </div>

                {/* Active Pipeline */}
                <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Active Pipeline</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{totalLeads}</span>
                        <span className="text-sm text-zinc-500">leads</span>
                    </div>
                </div>

                {/* Conversion Rate */}
                <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Conversion Rate</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-400">{conversionRate}%</span>
                        <span className="text-sm text-zinc-500">
                            {stats.paid}/{stats.paid + stats.lost}
                        </span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="hidden lg:block">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Pipeline Breakdown</p>
                    <div className="flex gap-3">
                        <div className="text-center">
                            <span className="text-lg font-semibold text-blue-400">{stats.incoming}</span>
                            <p className="text-xs text-zinc-600">New</p>
                        </div>
                        <div className="text-center">
                            <span className="text-lg font-semibold text-purple-400">{stats.processing}</span>
                            <p className="text-xs text-zinc-600">AI</p>
                        </div>
                        <div className="text-center">
                            <span className="text-lg font-semibold text-yellow-400">{stats.negotiating}</span>
                            <p className="text-xs text-zinc-600">Talk</p>
                        </div>
                        <div className="text-center">
                            <span className="text-lg font-semibold text-orange-400">{stats.contract_sent}</span>
                            <p className="text-xs text-zinc-600">Sign</p>
                        </div>
                        <div className="text-center">
                            <span className="text-lg font-semibold text-green-400">{stats.paid}</span>
                            <p className="text-xs text-zinc-600">Done</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(stats.incoming / totalLeads) * 100}%` }}
                />
                <div
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${(stats.processing / totalLeads) * 100}%` }}
                />
                <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${(stats.negotiating / totalLeads) * 100}%` }}
                />
                <div
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${(stats.contract_sent / totalLeads) * 100}%` }}
                />
                <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${(stats.paid / totalLeads) * 100}%` }}
                />
            </div>
        </div>
    );
}
