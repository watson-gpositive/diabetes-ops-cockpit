"use client";

import { CardWrapper } from "./CardWrapper";
import type { LoadState } from "./types";

interface BasalData {
  activeBasal: number;          // U/h
  tempBasalRate: number | null;  // U/h if active
  tempBasalRemaining: number | null; // minutes
  targetLow: number;
  targetHigh: number;
}

interface BasalCardProps {
  state: LoadState<BasalData>;
}

export function BasalCard({ state }: BasalCardProps) {
  return (
    <CardWrapper
      title="Basal & Target"
      isLoading={state.status === "loading"}
      error={state.status === "error" ? state.message : null}
    >
      {state.status === "ok" && (
        <div className="space-y-4">
          {/* Active basal */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-400">Active Basal</div>
              <div className="text-2xl font-bold tabular-nums text-white">
                {state.data.activeBasal.toFixed(2)}
                <span className="ml-1 text-sm font-normal text-zinc-400">U/h</span>
              </div>
            </div>

            {/* Temp basal badge */}
            {state.data.tempBasalRate !== null ? (
              <div className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-center">
                <div className="text-xs text-cyan-400">Temp Basal</div>
                <div className="text-sm font-bold tabular-nums text-cyan-300">
                  {state.data.tempBasalRate.toFixed(2)} U/h
                </div>
                {state.data.tempBasalRemaining !== null && (
                  <div className="text-xs text-cyan-500">
                    {state.data.tempBasalRemaining} min left
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-center">
                <div className="text-xs text-emerald-400">Standard Basal</div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Target range */}
          <div>
            <div className="text-xs text-zinc-400">Target Range</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-400">
                {state.data.targetLow}
              </span>
              <span className="text-zinc-500">—</span>
              <span className="text-xl font-bold text-emerald-400">
                {state.data.targetHigh}
              </span>
              <span className="text-sm text-zinc-500">mg/dL</span>
            </div>

            {/* Target range bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="relative h-full rounded-full bg-gradient-to-r from-emerald-500/60 via-emerald-400 to-emerald-500/60" />
            </div>
            <div className="mt-1 flex justify-between text-xs text-zinc-500">
              <span>{state.data.targetLow} mg/dL</span>
              <span>{state.data.targetHigh} mg/dL</span>
            </div>
          </div>
        </div>
      )}
    </CardWrapper>
  );
}
