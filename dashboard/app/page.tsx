"use client";

import { useState, useEffect } from "react";
import { MoneyStream } from "@/components/MoneyStream";
import { StatsBar } from "@/components/StatsBar";
import { EmergencyStop } from "@/components/EmergencyStop";
import { Lead, DashboardStats } from "@/lib/types";

// Mock data for demonstration
const mockStats: DashboardStats = {
  incoming: 12,
  processing: 8,
  negotiating: 15,
  contract_sent: 5,
  paid: 23,
  lost: 7,
  total_revenue: 1250000
};

const mockLeads: Record<string, Lead[]> = {
  incoming: [
    { id: "1", contact_name: "John Smith", contact_phone: "+1234567890", detected_intent: "buying", detected_urgency: 8, estimated_value: 15000, business_vertical: "real_estate", primary_language: "en", created_at: new Date().toISOString() },
    { id: "2", contact_name: "יוסי כהן", contact_phone: "+972501234567", detected_intent: "suing", detected_urgency: 9, estimated_value: 25000, business_vertical: "law", primary_language: "he", created_at: new Date().toISOString() },
    { id: "3", contact_name: "Sarah Davis", contact_phone: "+1987654321", detected_intent: "asking", detected_urgency: 5, estimated_value: 5000, business_vertical: "consulting", primary_language: "en", created_at: new Date().toISOString() },
  ],
  processing: [
    { id: "4", contact_name: "Michael Chen", contact_phone: "+1555123456", detected_intent: "buying", detected_urgency: 7, estimated_value: 45000, business_vertical: "real_estate", primary_language: "en", created_at: new Date().toISOString(), required_persona: "concierge" },
    { id: "5", contact_name: "אמילי לוי", contact_phone: "+972521234567", detected_intent: "selling", detected_urgency: 6, estimated_value: 120000, business_vertical: "real_estate", primary_language: "he", created_at: new Date().toISOString(), required_persona: "professional" },
  ],
  negotiating: [
    { id: "6", contact_name: "Robert Johnson", contact_phone: "+1666789012", detected_intent: "buying", detected_urgency: 8, estimated_value: 85000, business_vertical: "ecommerce", primary_language: "en", created_at: new Date().toISOString(), required_persona: "shark" },
    { id: "7", contact_name: "דנה אברהם", contact_phone: "+972541234567", detected_intent: "suing", detected_urgency: 9, estimated_value: 50000, business_vertical: "law", primary_language: "he", created_at: new Date().toISOString(), required_persona: "shark" },
    { id: "8", contact_name: "Emma Wilson", contact_phone: "+1777890123", detected_intent: "buying", detected_urgency: 7, estimated_value: 35000, business_vertical: "consulting", primary_language: "en", created_at: new Date().toISOString(), required_persona: "empath" },
  ],
  contract_sent: [
    { id: "9", contact_name: "David Brown", contact_phone: "+1888901234", detected_intent: "buying", detected_urgency: 6, estimated_value: 95000, business_vertical: "real_estate", primary_language: "en", created_at: new Date().toISOString() },
  ],
  paid: [
    { id: "10", contact_name: "Jennifer Martinez", contact_phone: "+1999012345", detected_intent: "buying", detected_urgency: 5, estimated_value: 150000, business_vertical: "real_estate", primary_language: "en", created_at: new Date().toISOString() },
    { id: "11", contact_name: "משה גולדברג", contact_phone: "+972531234567", detected_intent: "suing", detected_urgency: 8, estimated_value: 45000, business_vertical: "law", primary_language: "he", created_at: new Date().toISOString() },
  ]
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [leads, setLeads] = useState<Record<string, Lead[]>>(mockLeads);
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would fetch from API
      setStats(prev => ({
        ...prev,
        total_revenue: prev.total_revenue + Math.floor(Math.random() * 1000)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleEmergencyStop = async () => {
    setIsLoading(true);
    try {
      // In production: await fetch('/api/system/emergency-stop', { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSystemActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    try {
      // In production: await fetch('/api/system/resume', { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSystemActive(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Zero-Touch
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            God-View Dashboard • {isSystemActive ? "🟢 System Active" : "🔴 System Paused"}
          </p>
        </div>

        <EmergencyStop
          isActive={isSystemActive}
          isLoading={isLoading}
          onStop={handleEmergencyStop}
          onResume={handleResume}
        />
      </header>

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Money Stream Pipeline */}
      <MoneyStream leads={leads} />

      {/* System Status Footer */}
      <footer className="mt-8 text-center text-xs text-zinc-600">
        <p>Autonomous Business Ecosystem • English Primary | עברית Secondary</p>
        <p className="mt-1">Last sync: {new Date().toLocaleTimeString()}</p>
      </footer>
    </main>
  );
}
