/**
 * Nightscout client — public API surface
 *
 * Usage:
 *   import { fetchBgEntries, verifyConnectivity, buildConfigFromEnv } from "@/lib/nightscout";
 *
 *   const config = buildConfigFromEnv();
 *   if (!config) throw new Error("Nightscout not configured");
 *
 *   const result = await fetchBgEntries(config, { count: 10 });
 *   if (!result.ok) { console.error(result.error); return; }
 *   console.log(result.data);
 */

export * from "./types";
export * from "./client";
