"use client";

import { CardWrapper } from "./CardWrapper";
import type { LoadState } from "./types";
import type { BgEntry, TrendDirection } from "@/lib/nightscout/types";

interface BgCardProps {
  state: LoadState<{ entry: BgEntry; history: BgEntry[] }>;
}

const TREND_ARROWS: Record<TrendDirection, string> = {
  None: "—",
  DoubleUp: "⤴⤴",
  SingleUp: "↗",
  FortyFiveUp: "↗",
  Flat: "→",
  FortyFiveDown: "↘",
  SingleDown: "↘",
  DoubleDown: "⤓⤓",
  NotComputable: "?",
  RateOutOfRange: "↕",
};

const TREND_COLORS: Record<TrendDirection, string> = {
  None: "text-zinc-400",
  DoubleUp: "text-red-400",
  SingleUp: "text-orange-400",
  FortyFiveUp: "text-yellow-400",
  Flat: "text-emerald-400",
  FortyFiveDown: "text-cyan-400",
  SingleDown: "text-blue-400",
  DoubleDown: "text-indigo-400",
  NotComputable: "text-zinc-400",
  RateOutOfRange: "text-zinc-400",
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function bgColor(sgv: number): string {
  if (sgv < 70) return "text-red-400";
  if (sgv < 80) return "text-orange-400";
  if (sgv < 100) return "text-yellow-400";
  if (sgv < 140) return "text-emerald-400";
  if (sgv < 180) return "text-yellow-400";
  if (sgv < 250) return "text-orange-400";
  return "text-red-400";
}

function Sparkline({ history }: { history: BgEntry[] }) {
  if (history.length < 2) return null;
  const values = history.map((e) => e.sgv);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 120;
  const height = 32;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 h-8 w-full max-w-32 opacity-60"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polyline points={pts} className="text-emerald-400" />
    </svg>
  );
}

export function BgCard({ state }: BgCardProps) {
  return (
    <CardWrapper
      title="Blood Glucose"
      isLoading={state.status === "loading"}
      error={state.status === "error" ? state.message : null}
    >
      {state.status === "ok" && (
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold tabular-nums ${bgColor(state.data.entry.sgv)}`}>
                {state.data.entry.sgv}
              </span>
              <span className="text-sm text-zinc-400">mg/dL</span>
            </div>

            <div className={`mt-1 flex items-center gap-1 text-lg font-semibold ${TREND_COLORS[state.data.entry.direction]}`}>
              <span>{TREND_ARROWS[state.data.entry.direction]}</span>
              <span className="text-xs font-normal text-zinc-400">
                {state.data.entry.direction}
              </span>
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              {timeAgo(state.data.entry.date)}
            </div>
          </div>

          <Sparkline history={state.data.history} />
        </div>
      )}
    </CardWrapper>
  );
}
