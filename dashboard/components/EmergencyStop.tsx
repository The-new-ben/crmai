"use client";

interface EmergencyStopProps {
    isActive: boolean;
    isLoading: boolean;
    onStop: () => void;
    onResume: () => void;
}

export function EmergencyStop({ isActive, isLoading, onStop, onResume }: EmergencyStopProps) {
    return (
        <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
                <div
                    className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse-glow' : 'bg-red-500'}`}
                />
                <span className="text-sm text-zinc-400">
                    {isActive ? "All agents active" : "System paused"}
                </span>
            </div>

            {/* Control button */}
            {isActive ? (
                <button
                    onClick={onStop}
                    disabled={isLoading}
                    className="emergency-btn flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <span>🛑</span>
                    )}
                    <span>Emergency Stop</span>
                </button>
            ) : (
                <button
                    onClick={onResume}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <span>▶️</span>
                    )}
                    <span>Resume System</span>
                </button>
            )}
        </div>
    );
}
