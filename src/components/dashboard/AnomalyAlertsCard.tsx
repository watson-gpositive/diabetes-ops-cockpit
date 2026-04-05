"use client";

import { CardWrapper } from "./CardWrapper";
import type { LoadState } from "./types";
import type { AnomalyAlert, AnomalySeverity } from "@/lib/mock-data";

interface AnomalyAlertsCardProps {
  state: LoadState<AnomalyAlert[]>;
}

const SEVERITY_CONFIG: Record<
  AnomalySeverity,
  { border: string; bg: string; badge: string; dot: string }
> = {
  warning: {
    border: "border-amber-500/50",
    bg: "bg-amber-500/12",
    badge: "text-amber-300",
    dot: "bg-amber-400",
  },
  critical: {
    border: "border-red-500/60",
    bg: "bg-red-500/15",
    badge: "text-red-400",
    dot: "bg-red-400",
  },
  info: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    badge: "text-blue-400",
    dot: "bg-blue-400",
  },
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function AlertItem({ alert }: { alert: AnomalyAlert }) {
  const cfg = SEVERITY_CONFIG[alert.severity];
  return (
    <div
      className={`flex gap-3 rounded-xl border p-3 ${cfg.border} ${cfg.bg}`}
    >
      <div className={`mt-2 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-sm font-semibold ${cfg.badge}`}>
            {alert.title}
          </span>
          <span className="shrink-0 text-xs text-zinc-500">
            {timeAgo(alert.timestamp)}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          {alert.detail}
        </p>
      </div>
    </div>
  );
}

export function AnomalyAlertsCard({ state }: AnomalyAlertsCardProps) {
  return (
    <CardWrapper
      title="Anomaly Alerts"
      isLoading={state.status === "loading"}
      error={state.status === "error" ? state.message : null}
    >
      {state.status === "ok" && (
        <div className="space-y-2">
          {state.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 opacity-70">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="mt-3 text-sm font-medium text-emerald-400">All clear</p>
              <p className="mt-1 text-xs text-zinc-500">No anomalies detected</p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  {state.data.length} alert{state.data.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-zinc-500">Recent first</span>
              </div>
              <div className="space-y-2">
                {state.data.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </CardWrapper>
  );
}
