"use client";

import { CardWrapper } from "./CardWrapper";
import type { LoadState } from "./types";

type LoopStatusValue = "Looping" | "Not Looping" | "Suspended" | "Error" | "Unknown";

interface LoopStatusData {
  status: LoopStatusValue;
  lastLoop: number | null; // ms since epoch
  enactedRate: number | null; // U/h
  enactedDuration: number | null; // minutes
  reason: string | null;
  pumpStatus: string | null; // "normal" | "suspended" | "stopped"
  reservoir: number | null; // U
}

interface LoopStatusCardProps {
  state: LoadState<LoopStatusData>;
}

const STATUS_CONFIG: Record<
  LoopStatusValue,
  { label: string; dotColor: string; bgColor: string; borderColor: string; textColor: string }
> = {
  Looping: {
    label: "Looping",
    dotColor: "bg-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/40",
    textColor: "text-emerald-400",
  },
  "Not Looping": {
    label: "Open Loop",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/40",
    textColor: "text-amber-400",
  },
  Suspended: {
    label: "Suspended",
    dotColor: "bg-zinc-400",
    bgColor: "bg-zinc-500/10",
    borderColor: "border-zinc-500/40",
    textColor: "text-zinc-400",
  },
  Error: {
    label: "Error",
    dotColor: "bg-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/40",
    textColor: "text-red-400",
  },
  Unknown: {
    label: "Unknown",
    dotColor: "bg-zinc-600",
    bgColor: "bg-zinc-500/5",
    borderColor: "border-zinc-600/40",
    textColor: "text-zinc-500",
  },
};

function formatTimeAgo(ts: number | null): string {
  if (!ts) return "—";
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function LoopStatusCard({ state }: LoopStatusCardProps) {
  const cfg = state.status === "ok"
    ? STATUS_CONFIG[state.data.status]
    : STATUS_CONFIG.Unknown;

  return (
    <CardWrapper
      title="Loop Status"
      isLoading={state.status === "loading"}
      error={state.status === "error" ? state.message : null}
    >
      {state.status === "ok" && (
        <div className="space-y-3">
          {/* Status badge */}
          <div className="flex items-center gap-3">
            <span className={`relative flex h-3 w-3`}>
              <span
                className={`${cfg.dotColor} absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping`}
                style={{ animationDuration: "2s" }}
              />
              <span className={`${cfg.dotColor} relative inline-flex h-3 w-3 rounded-full`} />
            </span>
            <span className={`text-lg font-bold ${cfg.textColor}`}>
              {cfg.label}
            </span>
          </div>

          {/* Last loop time */}
          <div className="text-xs text-zinc-500">
            Last loop&nbsp;
            <span className="text-zinc-400">
              {formatTimeAgo(state.data.lastLoop)}
            </span>
          </div>

          {/* Enacted temp basal */}
          {state.data.enactedRate !== null && (
            <div className={`rounded border ${cfg.borderColor} ${cfg.bgColor} px-3 py-2`}>
              <div className="text-xs text-zinc-400">Last enacted</div>
              <div className="text-sm font-bold text-white">
                {state.data.enactedRate.toFixed(2)} U/h
                {state.data.enactedDuration !== null && (
                  <span className="ml-2 font-normal text-zinc-400">
                    · {state.data.enactedDuration} min
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Reason */}
          {state.data.reason && (
            <div className="text-xs text-zinc-500 italic">
              {state.data.reason}
            </div>
          )}

          {/* Pump status row */}
          <div className="flex gap-4 border-t border-white/10 pt-2">
            <div>
              <div className="text-xs text-zinc-500">Pump</div>
              <div className={`text-sm font-medium ${state.data.pumpStatus === "normal" ? "text-emerald-400" : "text-amber-400"}`}>
                {state.data.pumpStatus ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Reservoir</div>
              <div className={`text-sm font-medium ${(state.data.reservoir ?? 0) < 20 ? "text-amber-400" : "text-zinc-300"}`}>
                {state.data.reservoir !== null ? `${state.data.reservoir.toFixed(0)} U` : "—"}
              </div>
            </div>
          </div>
        </div>
      )}
    </CardWrapper>
  );
}
