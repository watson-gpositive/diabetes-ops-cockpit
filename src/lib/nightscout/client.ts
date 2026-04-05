/**
 * Nightscout API Client
 *
 * Typed fetchers for BG entries, treatments, profiles, and device status.
 * Auth via token passed as a query parameter (Nightscout standard).
 * All functions return ApiResponse<T> so callers always get a consistent shape.
 */

import type {
  ApiResponse,
  BgEntry,
  BgEntryQuery,
  DeviceStatus,
  DeviceStatusQuery,
  NightscoutConfig,
  Profile,
  ProfileQuery,
  Treatment,
  TreatmentQuery,
} from "./types";

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

async function nightscoutRequest<T>(
  path: string,
  config: NightscoutConfig,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<ApiResponse<T>> {
  const base = config.url.replace(/\/$/, "").replace(/\/api\/v1\/.*$/, ""); // strip any existing /api/v1/... to get clean base
  const url = new URL(`${base}/api/v1/${path}`);

  // Token auth: Nightscout uses token as a query param (not a header)
  url.searchParams.set("token", config.token);
  url.searchParams.set("secret", config.token);

  // Optional additional params
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // Next.js cache control — use server components default cache,
      // or let callers override via cache: "no-store" etc.
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "(no body)");
      return {
        ok: false,
        data: null,
        error: {
          message: `Nightscout API error ${res.status}: ${res.statusText}`,
          status: res.status,
          endpoint: path,
        },
      };
    }

    const json = await res.json();
    return { ok: true, data: json as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      data: null,
      error: { message: `Fetch failed: ${message}`, endpoint: path },
    };
  }
}

// ---------------------------------------------------------------------------
// BG Entries
// ---------------------------------------------------------------------------

export async function fetchBgEntries(
  config: NightscoutConfig,
  query: BgEntryQuery = {},
): Promise<ApiResponse<BgEntry[]>> {
  const params: Record<string, string | number | boolean | undefined> = {
    count: query.count ?? 100,
    ...(query.startDate && {
      startDate: new Date(query.startDate).toISOString(),
    }),
    ...(query.endDate && { endDate: new Date(query.endDate).toISOString() }),
    ...(query.raw !== undefined && { raw: query.raw }),
  };

  return nightscoutRequest<BgEntry[]>("entries", config, params);
}

export async function fetchLatestBg(
  config: NightscoutConfig,
): Promise<ApiResponse<BgEntry>> {
  const result = await fetchBgEntries(config, { count: 1 });
  if (!result.ok || !result.data || result.data.length === 0) {
    return {
      ok: result.ok,
      data: null,
      error:
        result.error ??
        { message: "No BG entries returned", endpoint: "entries" },
    };
  }
  return { ok: true, data: result.data[0], error: null };
}

export async function fetchBgTrends(
  config: NightscoutConfig,
  count = 24,
): Promise<ApiResponse<BgEntry[]>> {
  return fetchBgEntries(config, { count });
}

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------

export async function fetchTreatments(
  config: NightscoutConfig,
  query: TreatmentQuery = {},
): Promise<ApiResponse<Treatment[]>> {
  const params: Record<string, string | number | boolean | undefined> = {
    ...(query.startDate && {
      startDate: new Date(query.startDate).toISOString(),
    }),
    ...(query.endDate && { endDate: new Date(query.endDate).toISOString() }),
    ...(query.count !== undefined && { count: query.count }),
    ...(query.history !== undefined && { history: query.history }),
  };

  return nightscoutRequest<Treatment[]>("treatments", config, params);
}

export async function fetchRecentTreatments(
  config: NightscoutConfig,
  hours = 24,
): Promise<ApiResponse<Treatment[]>> {
  const endDate = Date.now();
  const startDate = endDate - hours * 60 * 60 * 1000;
  return fetchTreatments(config, { startDate, endDate });
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function fetchProfile(
  config: NightscoutConfig,
  query: ProfileQuery = {},
): Promise<ApiResponse<Profile | Profile[]>> {
  const params: Record<string, string | number | boolean | undefined> = {
    ...(query.profile && { profile: query.profile }),
    ...(query.store !== undefined && { store: query.store }),
    ...(query.date !== undefined && { date: query.date }),
  };

  return nightscoutRequest<Profile | Profile[]>("profile", config, params);
}

export async function fetchCurrentProfile(
  config: NightscoutConfig,
): Promise<ApiResponse<Profile>> {
  const result = await fetchProfile(config, { store: true });
  if (!result.ok) return result as ApiResponse<Profile>;

  // Profile API returns an array or object depending on Nightscout version
  const profiles = Array.isArray(result.data) ? result.data : [result.data];
  if (profiles.length === 0) {
    return {
      ok: false,
      data: null,
      error: { message: "No profile found", endpoint: "profile" },
    };
  }

  // Return the first (most recent) profile
  return { ok: true, data: profiles[0] as Profile, error: null };
}

// ---------------------------------------------------------------------------
// Device Status
// ---------------------------------------------------------------------------

export async function fetchDeviceStatus(
  config: NightscoutConfig,
  query: DeviceStatusQuery = {},
): Promise<ApiResponse<DeviceStatus[]>> {
  const params: Record<string, string | number | boolean | undefined> = {
    ...(query.count !== undefined && { count: query.count }),
    ...(query.device && { device: query.device }),
    ...(query.fields && { fields: query.fields }),
  };

  return nightscoutRequest<DeviceStatus[]>("devicestatus", config, params);
}

export async function fetchLatestDeviceStatus(
  config: NightscoutConfig,
): Promise<ApiResponse<DeviceStatus>> {
  const result = await fetchDeviceStatus(config, { count: 1 });
  if (!result.ok || !result.data || result.data.length === 0) {
    return {
      ok: result.ok,
      data: null,
      error:
        result.error ??
        { message: "No device status returned", endpoint: "devicestatus" },
    };
  }
  return { ok: true, data: result.data[0], error: null };
}

// ---------------------------------------------------------------------------
// Connection verification (dummy-safe)
// ---------------------------------------------------------------------------

export type ConnectivityResult =
  | { reachable: true; latencyMs: number; version?: string }
  | { reachable: false; error: string };

/**
 * Lightweight reachability check — fetches a single BG entry.
 * Succeeds or fails without throwing, so safe to call with dummy config.
 */
export async function verifyConnectivity(
  config: NightscoutConfig,
): Promise<ConnectivityResult> {
  const start = Date.now();

  // Use /status endpoint first as it's the lightest
  const statusResult = await nightscoutRequest<{
    status: string;
    version?: string;
    name?: string;
  }>("status", config);

  if (statusResult.ok && statusResult.data) {
    return {
      reachable: true,
      latencyMs: Date.now() - start,
      version: statusResult.data.version,
    };
  }

  // Fall back to entries — if it returns even an auth error,
  // we know the server is reachable (vs. network failure)
  const entriesResult = await nightscoutRequest<unknown>("entries", config, {
    count: 1,
  });

  if (entriesResult.ok) {
    return {
      reachable: true,
      latencyMs: Date.now() - start,
    };
  }

  // Network-level failure
  return {
    reachable: false,
    error:
      entriesResult.error?.message ??
      "Could not reach Nightscout server",
  };
}

// ---------------------------------------------------------------------------
// Convenience: build config from env
// ---------------------------------------------------------------------------

export function buildConfigFromEnv(): NightscoutConfig | null {
  const url = process.env.NIGHTSCOUT_URL;
  const token = process.env.NIGHTSCOUT_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}
