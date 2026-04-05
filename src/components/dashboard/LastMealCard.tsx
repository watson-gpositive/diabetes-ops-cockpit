"use client";

import { CardWrapper } from "./CardWrapper";
import type { LoadState } from "./types";
import type { Treatment } from "@/lib/nightscout/types";

interface LastMealData {
  treatment: Treatment;
}

interface LastMealCardProps {
  state: LoadState<LastMealData>;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function LastMealCard({ state }: LastMealCardProps) {
  return (
    <CardWrapper
      title="Last Meal / Carbs"
      isLoading={state.status === "loading"}
      error={state.status === "error" ? state.message : null}
    >
      {state.status === "ok" && (
        <div className="space-y-3">
          {/* Carbs hero */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <span className="text-2xl font-bold">{state.data.treatment.carbs ?? 0}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-amber-300">grams carbs</div>
              <div className="text-xs text-zinc-400">
                {formatTime(state.data.treatment.created_at)} · {timeAgo(state.data.treatment.created_at)}
              </div>
            </div>
          </div>

          {/* Notes */}
          {state.data.treatment.notes && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="text-xs text-zinc-500">Notes</div>
              <div className="mt-0.5 text-sm text-zinc-200">{state.data.treatment.notes}</div>
            </div>
          )}

          {/* Type badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
              🍽 {state.data.treatment.eventType ?? state.data.treatment.type}
            </span>
            <span className="text-xs text-zinc-500">
              {timeAgo(state.data.treatment.created_at)} ago
            </span>
          </div>
        </div>
      )}
    </CardWrapper>
  );
}
