"use client";

/**
 * useNightscout — SWR hooks wrapping the Nightscout client fetchers.
 *
 * All hooks use a 5-minute refresh window (revalidateOnMount: true to
 * they don't spike load on first render — data arrives from the client-side
 * cache if available, then revalidates in background).
 *
 * To force-refresh, call the mutate() returned by each hook.
 */

import useSWR from "swr";
import type { BgEntry, Treatment } from "@/lib/nightscout/types";
import type { AnomalyAlert, AnomalySeverity } from "@/lib/mock-data";
import {
  fetchLatestBg,
  fetchBgTrends,
  fetchLatestDeviceStatus,
  fetchCurrentProfile,
  fetchRecentTreatments,
} from "@/lib/nightscout/client";

// ---------------------------------------------------------------------------
// Config — reads from window.__NIGHTSCOUT_CONFIG__ injected by the page.
// Fallback to env-backed config so SSR builds don't break.
// ---------------------------------------------------------------------------

interface NightscoutWindow {
  __NIGHTSCOUT_CONFIG__?: {
    url: string;
    token: string;
  } | null;
}

declare global {
  interface Window extends NightscoutWindow {}
}

export function getNightscoutConfig() {
  if (typeof window !== "undefined" && window.__NIGHTSCOUT_CONFIG__) {
    return window.__NIGHTSCOUT_CONFIG__;
  }
  // At runtime the page always injects from window, so null here means
  // the page hasn't hydrated yet — SWR will revalidate once it does.
  return null;
}

// ---------------------------------------------------------------------------
// Shared fetcher — passes config as the second arg (avoids re-creating
// the fetcher function on every render).
// ---------------------------------------------------------------------------

async function fetcher<T>(
  fn: (url: string, token: string) => Promise<T>,
): Promise<T> {
  const config = getNightscoutConfig();
  if (!config) throw new Error("Nightscout config not available");
  return fn(config.url, config.token);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useBgData() {
  return useSWR(
    "nightscout:bg",
    async () => {
      const config = getNightscoutConfig();
      if (!config) throw new Error("Nightscout config not available");

      const [bgResult, trendsResult] = await Promise.all([
        fetchLatestBg({ url: config.url, token: config.token }),
        fetchBgTrends({ url: config.url, token: config.token }, 24),
      ]);

      if (!bgResult.ok || !bgResult.data) {
        throw new Error(bgResult.error?.message ?? "Failed to load BG");
      }

      return {
        entry: bgResult.data,
        history: trendsResult.ok ? (trendsResult.data ?? []) : [],
      };
    },
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnMount: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    },
  );
}

export function useIobCob() {
  return useSWR(
    "nightscout:iobcob",
    async () => {
      const config = getNightscoutConfig();
      if (!config) throw new Error("Nightscout config not available");

      const result = await fetchLatestDeviceStatus({
        url: config.url,
        token: config.token,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.error?.message ?? "Failed to load IOB/COB");
      }

      // AAPS stores IOB/COB in openaps.iob (not loop.IOB/COB)
      const device = result.data as Record<string, unknown>;
      const openapsRaw = (device.openaps ?? null) as Record<string, unknown> | null;
      const iobRaw = (openapsRaw?.iob ?? null) as Record<string, unknown> | null;
      const iob = typeof iobRaw?.iob === 'number' ? iobRaw.iob as number : 0;
      const cob = typeof openapsRaw?.cob === 'number' ? openapsRaw.cob as number : 0;
      return { iob, cob };
    },
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnMount: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    },
  );
}

export function useBasalData() {
  return useSWR(
    "nightscout:basal",
    async () => {
      const config = getNightscoutConfig();
      if (!config) throw new Error("Nightscout config not available");

      const [profileResult, deviceResult] = await Promise.all([
        fetchCurrentProfile({ url: config.url, token: config.token }),
        fetchLatestDeviceStatus({ url: config.url, token: config.token }),
      ]);

      const profile = profileResult.ok ? profileResult.data : null;
      const device = deviceResult.ok ? deviceResult.data : null;

      // Basal from profile: basal is nested inside store["ProfileName"] in Nightscout
      let activeBasal: number | null = null;
      let targetLow = 80;
      let targetHigh = 120;
      const profileRaw = (profileResult.data ?? null) as Record<string, unknown> | null;
      if (profileResult.ok && profileRaw) {
        const defaultProfile = (profileRaw.defaultProfile as string | null) ?? null;
        const store = (profileRaw.store ?? null) as Record<string, Record<string, unknown>> | null;
        if (defaultProfile && store && store[defaultProfile]) {
          const profileData = store[defaultProfile];
          const basalArr = profileData.basal as Array<{ time: string; timeAsSeconds: number; value: number }> | null;
          if (Array.isArray(basalArr) && basalArr.length > 0) {
            // Find the current time segment
            const now = new Date();
            const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            let current = basalArr[0];
            for (const entry of basalArr) {
              if (entry.timeAsSeconds <= currentSeconds) {
                current = entry;
              }
            }
            if (typeof current.value === "number") activeBasal = current.value;
          }
          const targetLowArr = profileData.target_low as Array<{ time: string; value: number }> | null;
          const targetHighArr = profileData.target_high as Array<{ time: string; value: number }> | null;
          if (targetLowArr && targetLowArr.length > 0) targetLow = targetLowArr[0].value ?? 80;
          if (targetHighArr && targetHighArr.length > 0) targetHigh = targetHighArr[0].value ?? 120;
        }
      }
      // Fall back to pump basal rate
      const pumpRaw = (device?.pump ?? null) as Record<string, unknown> | null;
      if (activeBasal === null && typeof pumpRaw?.basalRate === "number") {
        activeBasal = pumpRaw.basalRate as number;
      }
      // Fall back to enacted / suggested rate
      const loopRaw = (device?.loop ?? null) as Record<string, unknown> | null;
      const openapsRaw = (device?.openaps ?? null) as Record<string, unknown> | null;
      const enactedRaw = (loopRaw?.enacted ?? null) as Record<string, unknown> | null;
      const suggestedRaw = (openapsRaw?.suggested ?? null) as Record<string, unknown> | null;
      if (activeBasal === null) {
        const rate = ((enactedRaw?.rate ?? suggestedRaw?.rate ?? null) as number | null);
        activeBasal = rate;
      }

      const tempBasalRate = (loopRaw?.tempBasal as Record<string, unknown> | null)?.tempBasalRate as number | null ?? null;
      const tempBasalRemaining = (loopRaw?.tempBasal as Record<string, unknown> | null)?.remaining as number | null ?? null;

      return {
        activeBasal: activeBasal ?? 0,
        tempBasalRate,
        tempBasalRemaining,
        targetLow,
        targetHigh,
      };
    },
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnMount: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    },
  );
}

export function useLastMeal() {
  return useSWR(
    "nightscout:lastMeal",
    async () => {
      const config = getNightscoutConfig();
      if (!config) throw new Error("Nightscout config not available");

      const result = await fetchRecentTreatments(
        { url: config.url, token: config.token },
        12, // last 12 hours
      );

      if (!result.ok || !result.data) {
        throw new Error(result.error?.message ?? "Failed to load treatments");
      }

      // Find the most recent carb treatment
      const carbTreatments = (result.data as Treatment[]).filter(
        (t) => t.carbs && t.carbs > 0,
      );

      if (carbTreatments.length === 0) {
        // Return a placeholder treatment rather than throwing
        return {
          treatment: {
            id: "placeholder",
            created_at: 0,
            dateString: "1970-01-01T00:00:00.000Z",
            type: "Carbs",
            eventType: "Meal",
            carbs: 0,
            notes: "No recent carb entries",
          } as unknown as Treatment,
        };
      }

      // Sort by date descending
      carbTreatments.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      return { treatment: carbTreatments[0] };
    },
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnMount: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    },
  );
}

export function useAlerts() {
  return useSWR(
    "nightscout:alerts",
    async () => {
      const config = getNightscoutConfig();
      if (!config) throw new Error("Nightscout config not available");

      // Parallel fetch: BG history (15 min = 3 entries at 5 min), recent treatments, device status
      const [bgResult, treatmentsResult, deviceResult] = await Promise.all([
        fetchBgTrends({ url: config.url, token: config.token }, 3),
        fetchRecentTreatments({ url: config.url, token: config.token }, 2), // last 2 hours
        fetchLatestDeviceStatus({ url: config.url, token: config.token }),
      ]);

      if (!bgResult.ok || !bgResult.data) {
        throw new Error(bgResult.error?.message ?? "Failed to load alerts data");
      }

      const entries = bgResult.data;
      const latest = entries[0];
      const now = Date.now();
      const alerts: AnomalyAlert[] = [];

      // ── Rule 1: BG < 70 ──────────────────────────────────────────────────
      if (latest && latest.sgv < 70) {
        alerts.push({
          id: "rule-bg-low",
          severity: latest.sgv < 54 ? "critical" : "warning",
          title: latest.sgv < 54 ? "Critical Low" : "Low Glucose",
          detail: `BG is ${latest.sgv} mg/dL — below target range`,
          timestamp: latest.date,
        });
      }

      // ── Rule 2: BG drop > 50 mg/dL in ~15 min (3 × 5-min intervals) ──────
      // Requires IOB > 0.5 U to be actionable (risk of over-correction)
      if (entries.length >= 3 && latest) {
        const device = deviceResult.ok ? deviceResult.data : null;
        const openapsRaw = (device?.openaps ?? null) as Record<string, unknown> | null;
        const iobRaw = (openapsRaw?.iob ?? null) as Record<string, unknown> | null;
        const iob = typeof iobRaw?.iob === 'number' ? iobRaw.iob as number : 0;
        const oldest = entries[entries.length - 1];
        const drop = oldest.sgv - latest.sgv;
        if (drop > 50 && iob > 0.5) {
          alerts.push({
            id: "rule-bg-drop",
            severity: "critical",
            title: "Rapid BG Drop",
            detail: `Dropped ${drop} mg/dL in ~15 min with ${iob.toFixed(1)} U IOB — risk of over-correction`,
            timestamp: latest.date,
          });
        }
      }

      // ── Rule 3: BG > 180 with no bolus in last 2 hours ────────────────────
      if (latest && latest.sgv > 180) {
        const treatments = treatmentsResult.ok ? (treatmentsResult.data ?? []) : [];
        const twoHoursAgo = now - 2 * 60 * 60 * 1000;
        const recentBolus = treatments.find(
          (t) => {
            const insulinOk = t.eventType === "Bolus" || t.eventType === "Meal Bolus" || t.insulin != null;
            if (!insulinOk) return false;
            const ts = typeof t.created_at === 'string' ? new Date(t.created_at).getTime() : t.created_at;
            return ts > twoHoursAgo;
          }
        );
        if (!recentBolus) {
          alerts.push({
            id: "rule-bg-high-no-bolus",
            severity: latest.sgv > 250 ? "critical" : "warning",
            title: "High BG — No Recent Bolus",
            detail: `BG at ${latest.sgv} mg/dL with no bolus in the last 2 hours`,
            timestamp: latest.date,
          });
        }
      }

      // ── Rule 4: Open loop (not looping) for > 30 minutes ─────────────────
      // AAPS: loop data in openaps.suggested.timestamp
      if (deviceResult.ok && deviceResult.data) {
        const device = deviceResult.data as Record<string, unknown>;
        const openapsRaw = (device.openaps ?? null) as Record<string, unknown> | null;
        const suggestedRaw = (openapsRaw?.suggested ?? null) as Record<string, unknown> | null;
        const suggestedTs = suggestedRaw?.timestamp as string | null;
        const lastLoopTs = suggestedTs ? new Date(suggestedTs).getTime() : null;
        if (lastLoopTs === null) {
          alerts.push({
            id: "rule-open-loop",
            severity: "warning",
            title: "Open Loop — No Recent Data",
            detail: "No loop activity found in device status",
            timestamp: latest?.date ?? now,
          });
        } else {
          const loopAgeMs = now - lastLoopTs;
          const loopAgeMin = Math.floor(loopAgeMs / 60000);
          if (loopAgeMin > 30) {
            const reason = typeof suggestedRaw?.reason === 'string' ? suggestedRaw.reason as string : null;
            alerts.push({
              id: "rule-open-loop",
              severity: "critical",
              title: "Open Loop Detected",
              detail: reason
                ? `Loop inactive for ${loopAgeMin} min. Reason: ${reason}`
                : `Loop inactive for ${loopAgeMin} min — pump not in auto mode`,
              timestamp: lastLoopTs,
            });
          }
        }
      }

      // ── Rule 5: CGM gap > 15 minutes ──────────────────────────────────────
      if (latest) {
        const gapMs = now - latest.date;
        const gapMin = Math.floor(gapMs / 60000);
        if (gapMin > 15) {
          alerts.push({
            id: "rule-cgm-gap",
            severity: "warning",
            title: "CGM Gap Detected",
            detail: `No CGM data for ${gapMin} minutes — check sensor and phone connection`,
            timestamp: latest.date,
          });
        }
      }

      // Sort by severity (critical first) then by timestamp (newest first)
      const severityRank: Record<AnomalySeverity, number> = {
        critical: 0,
        warning: 1,
        info: 2,
      };
      alerts.sort((a, b) => {
        const sd = severityRank[a.severity] - severityRank[b.severity];
        return sd !== 0 ? sd : b.timestamp - a.timestamp;
      });

      return alerts;
    },
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnMount: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    },
  );
}

type LoopStatusValue = "Looping" | "Not Looping" | "Suspended" | "Error" | "Unknown";

export interface LoopStatusData {
  status: LoopStatusValue;
  lastLoop: number | null;
  enactedRate: number | null;
  enactedDuration: number | null;
  reason: string | null;
  pumpStatus: string | null;
  reservoir: number | null;
}

export function useLoopStatus() {
  return useSWR(
    "nightscout:loopStatus",
    async () => {
      const config = getNightscoutConfig();
      if (!config) throw new Error("Nightscout config not available");

      const result = await fetchLatestDeviceStatus({
        url: config.url,
        token: config.token,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.error?.message ?? "Failed to load loop status");
      }

      const device = result.data as unknown as Record<string, unknown>;
      // AAPS stores loop data in openaps.suggested (not loop.status)
      const openapsRaw = (device.openaps ?? null) as Record<string, unknown> | null;
      const suggestedRaw = (openapsRaw?.suggested ?? null) as Record<string, unknown> | null;
      const pumpRaw = (device.pump ?? null) as Record<string, unknown> | null;
      const pumpExtended = (pumpRaw?.extended ?? null) as Record<string, unknown> | null;

      // Determine status: AAPS has suggested data when it last ran
      let status: LoopStatusValue = "Unknown";
      if (suggestedRaw) {
        status = "Looping";
      } else if (openapsRaw && !suggestedRaw) {
        status = "Not Looping";
      }

      // Pump status from extended info
      const activeProfile = typeof pumpExtended?.ActiveProfile === 'string' ? pumpExtended.ActiveProfile as string : null;
      const pumpStatus = activeProfile;

      // Reservoir from pump extended
      const reservoir = typeof pumpExtended?.Reservoir === 'number' ? pumpExtended.Reservoir as number : null;

      // Last loop timestamp: suggested.timestamp is an ISO string in AAPS
      let lastLoop: number | null = null;
      const suggestedTs = suggestedRaw?.timestamp as string | null;
      if (suggestedTs) {
        lastLoop = new Date(suggestedTs).getTime();
      } else {
        const createdAt = device.created_at as string | number | null;
        if (typeof createdAt === 'string') lastLoop = new Date(createdAt).getTime();
        else if (typeof createdAt === 'number') lastLoop = createdAt;
      }

      // Enacted rate from suggested (AAPS enacts temp basals via suggested)
      const enactedRate = typeof suggestedRaw?.rate === 'number' ? suggestedRaw.rate as number : null;
      const enactedDuration = typeof suggestedRaw?.duration === 'number' ? Math.round(suggestedRaw.duration as number) : null;

      // Reason
      const reason = typeof suggestedRaw?.reason === 'string' ? suggestedRaw.reason as string : null;

      return {
        status,
        lastLoop,
        enactedRate,
        enactedDuration,
        reason,
        pumpStatus,
        reservoir,
      } satisfies LoopStatusData;
    },
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnMount: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    },
  );
}
