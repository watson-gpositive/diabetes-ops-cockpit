"use client";

import { CardWrapper } from "./CardWrapper";
import type { LoadState } from "./types";

interface IobCobData {
  iob: number;
  cob: number;
}

interface IobCobCardProps {
  state: LoadState<IobCobData>;
}

const IOB_MAX = 10; // visual max for bar
const COB_MAX = 100; // visual max for bar

function InsulinBar({ value }: { value: number }) {
  const pct = Math.min((value / IOB_MAX) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>IOB</span>
        <span className="tabular-nums font-medium text-white">{value.toFixed(2)} U</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CarbsBar({ value }: { value: number }) {
  const pct = Math.min((value / COB_MAX) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>COB</span>
        <span className="tabular-nums font-medium text-white">{value} g</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function IobCobCard({ state }: IobCobCardProps) {
  return (
    <CardWrapper
      title="Insulin & Carbs On Board"
      isLoading={state.status === "loading"}
      error={state.status === "error" ? state.message : null}
    >
      {state.status === "ok" && (
        <div className="space-y-4">
          <InsulinBar value={state.data.iob} />
          <CarbsBar value={state.data.cob} />

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="rounded-lg bg-white/5 p-2 text-center">
              <div className="text-lg font-bold text-indigo-400">{state.data.iob.toFixed(2)}</div>
              <div className="text-xs text-zinc-500">units insulin</div>
            </div>
            <div className="rounded-lg bg-white/5 p-2 text-center">
              <div className="text-lg font-bold text-amber-400">{state.data.cob}</div>
              <div className="text-xs text-zinc-500">grams carbs</div>
            </div>
          </div>
        </div>
      )}
    </CardWrapper>
  );
}
