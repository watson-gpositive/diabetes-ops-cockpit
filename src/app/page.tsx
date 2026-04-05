"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BgCard,
  IobCobCard,
  BasalCard,
  LastMealCard,
  AnomalyAlertsCard,
  LoopStatusCard,
  type LoadState,
} from "@/components/dashboard";
import type { BgEntry, Treatment } from "@/lib/nightscout/types";
import type { AnomalyAlert } from "@/lib/mock-data";
import {
  useBgData,
  useIobCob,
  useBasalData,
  useLastMeal,
  useAlerts,
  useLoopStatus,
  type LoopStatusData,
} from "@/hooks/useNightscout";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import useSWR from "swr";

// ---------------------------------------------------------------------------
// Inject Nightscout config from env into window so the hooks can read it.
// ---------------------------------------------------------------------------

function injectConfig() {
  if (typeof window === "undefined") return;
  if (window.__NIGHTSCOUT_CONFIG__ !== undefined) return; // already set

  const url = process.env.NIGHTSCOUT_URL ?? "";
  const token = process.env.NIGHTSCOUT_TOKEN ?? "";
  window.__NIGHTSCOUT_CONFIG__ = url && token ? { url, token } : null;
}

// ---------------------------------------------------------------------------
// LastUpdated — tracks the most recent successful fetch timestamp
// ---------------------------------------------------------------------------

function useLastUpdated() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  function touch() {
    setLastUpdated(new Date());
  }

  return { lastUpdated, touch };
}

function formatLastUpdated(date: Date | null): string {
  if (!date) return "Never";
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Pull-to-refresh overlay
// ---------------------------------------------------------------------------

function PullToRefreshOverlay({
  isPulling,
  distance,
}: {
  isPulling: boolean;
  distance: number;
}) {
  const show =
    isPulling || distance > 0;
  const clampedDist = Math.min(distance, 80);
  const opacity = show ? Math.min(clampedDist / 60, 1) : 0;
  const rotate = isPulling ? 0 : 180; // flip arrow back when released

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center justify-center"
      style={{
        height: clampedDist,
        opacity,
        transition: isPulling ? "none" : "opacity 0.3s ease",
      }}
    >
      <div className="flex flex-col items-center gap-1">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-400"
          style={{
            transform: `rotate(${distance >= 80 && !isPulling ? 360 : 0}deg)`,
            transition: "transform 0.3s ease",
          }}
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        {distance >= 80 && (
          <span className="text-xs text-zinc-400">Release to refresh</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hook-to-LoadState adapter
// ---------------------------------------------------------------------------

function useAdapter<T>(
  swr: ReturnType<typeof useSWR<T, Error>>,
): LoadState<T> {
  const { isLoading, error, data } = swr;

  if (isLoading) return { status: "loading" };
  if (error)
    return {
      status: "error",
      message: error.message ?? "Unknown error",
    };
  if (data !== undefined) return { status: "ok", data };
  return { status: "loading" };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  // Inject config on mount (client-side only)
  useEffect(() => {
    injectConfig();
  }, []);

  const { lastUpdated, touch } = useLastUpdated();

  // SWR hooks
  const bgSwr = useBgData();
  const iobCobSwr = useIobCob();
  const basalSwr = useBasalData();
  const lastMealSwr = useLastMeal();
  const alertsSwr = useAlerts();
  const loopStatusSwr = useLoopStatus();

  // Touch lastUpdated on successful revalidation
  useEffect(() => {
    if (bgSwr.data) touch();
  }, [bgSwr.data, touch]);
  useEffect(() => {
    if (iobCobSwr.data) touch();
  }, [iobCobSwr.data, touch]);
  useEffect(() => {
    if (basalSwr.data) touch();
  }, [basalSwr.data, touch]);
  useEffect(() => {
    if (lastMealSwr.data) touch();
  }, [lastMealSwr.data, touch]);
  useEffect(() => {
    if (alertsSwr.data) touch();
  }, [alertsSwr.data, touch]);
  useEffect(() => {
    if (loopStatusSwr.data) touch();
  }, [loopStatusSwr.data, touch]);

  // Derive LoadStates from SWR
  const bgState = useAdapter<{ entry: BgEntry; history: BgEntry[] }>(bgSwr);
  const iobCobState = useAdapter<{ iob: number; cob: number }>(iobCobSwr);
  const basalState = useAdapter<{
    activeBasal: number;
    tempBasalRate: number | null;
    tempBasalRemaining: number | null;
    targetLow: number;
    targetHigh: number;
  }>(basalSwr);
  const lastMealState = useAdapter<{ treatment: Treatment }>(lastMealSwr);
  const alertsState = useAdapter<AnomalyAlert[]>(alertsSwr);
  const loopStatusState = useAdapter<LoopStatusData>(loopStatusSwr);

  // Pull-to-refresh — revalidate all keys
  const handleRefresh = useCallback(() => {
    void bgSwr.mutate();
    void iobCobSwr.mutate();
    void basalSwr.mutate();
    void lastMealSwr.mutate();
    void alertsSwr.mutate();
    void loopStatusSwr.mutate();
  }, [bgSwr, iobCobSwr, basalSwr, lastMealSwr, alertsSwr, loopStatusSwr]);

  const { isPulling, pullDistance, reset } = usePullToRefresh(handleRefresh);

  // Is any card currently fetching in the background?
  const isRefetching =
    bgSwr.isValidating ||
    iobCobSwr.isValidating ||
    basalSwr.isValidating ||
    lastMealSwr.isValidating ||
    alertsSwr.isValidating ||
    loopStatusSwr.isValidating;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 px-4 py-8">
      {/* Pull-to-refresh overlay */}
      <PullToRefreshOverlay isPulling={isPulling} distance={pullDistance} />

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Diabetes Ops Cockpit
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Real-time overview ·{" "}
                <span className="text-zinc-500">{today}</span>
              </p>
            </div>

            {/* Last updated + refresh indicator */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-zinc-500">
                {formatLastUpdated(lastUpdated)}
              </span>
              {isRefetching && (
                <span className="text-xs text-zinc-600">
                  ↻ refreshing…
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Responsive grid: 1 col mobile → 2 cols tablet → 3 cols desktop */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {/* BG — full width on all breakpoints */}
          <div className="sm:col-span-2 xl:col-span-3">
            <BgCard state={bgState} />
          </div>

          {/* IOB / COB */}
          <IobCobCard state={iobCobState} />

          {/* Basal */}
          <BasalCard state={basalState} />

          {/* Loop Status */}
          <LoopStatusCard state={loopStatusState} />

          {/* Last Meal — full width on all breakpoints */}
          <div className="sm:col-span-2 xl:col-span-3">
            <LastMealCard state={lastMealState} />
          </div>

          {/* Anomaly Alerts — full width on all breakpoints */}
          <div className="sm:col-span-2 xl:col-span-3">
            <AnomalyAlertsCard state={alertsState} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t border-white/5 pt-4 text-center">
          <p className="text-xs text-zinc-600">
            Pull down to refresh · Auto-updates every 5 min
          </p>
        </footer>
      </div>
    </div>
  );
}
