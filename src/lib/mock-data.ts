/**
 * Mock data for the diabetes ops cockpit dashboard.
 * Replace with live Nightscout data once API client is wired up.
 */

import type { BgEntry, Treatment, Profile, DeviceStatus } from "./nightscout/types";

export const MOCK_LATEST_BG: BgEntry = {
  sgv: 142,
  direction: "Flat",
  bg: 142,
  date: Date.now() - 5 * 60 * 1000, // 5 min ago
  dateString: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  device: "xdrip://Giannis",
  type: "sgv",
  rate: 0,
};

export const MOCK_BG_HISTORY: BgEntry[] = [
  { ...MOCK_LATEST_BG },
  { ...MOCK_LATEST_BG, sgv: 138, date: Date.now() - 11 * 60 * 1000, dateString: new Date(Date.now() - 11 * 60 * 1000).toISOString() },
  { ...MOCK_LATEST_BG, sgv: 131, date: Date.now() - 17 * 60 * 1000, dateString: new Date(Date.now() - 17 * 60 * 1000).toISOString() },
  { ...MOCK_LATEST_BG, sgv: 128, date: Date.now() - 23 * 60 * 1000, dateString: new Date(Date.now() - 23 * 60 * 1000).toISOString() },
  { ...MOCK_LATEST_BG, sgv: 135, date: Date.now() - 29 * 60 * 1000, dateString: new Date(Date.now() - 29 * 60 * 1000).toISOString() },
];

export const MOCK_IOB = 2.35; // units
export const MOCK_COB = 35;   // grams

export const MOCK_ACTIVE_BASAL = 0.85; // U/h
export const MOCK_TEMP_BASAL_RATE: number | null = 1.1; // U/h (active temp basal)
export const MOCK_TEMP_BASAL_REMAINING = 25; // minutes remaining
export const MOCK_TARGET_LOW = 100;
export const MOCK_TARGET_HIGH = 120;

export const MOCK_LAST_MEAL: Treatment = {
  id: "meal-001",
  created_at: Date.now() - 45 * 60 * 1000, // 45 min ago
  dateString: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  type: "Carbs",
  carbs: 45,
  eventType: "Carbs",
  notes: "Lunch — whole grain sandwich + fruit",
  device: "androidaps",
};

export const MOCK_PROFILE: Profile = {
  id: "default",
  defaultProfile: "Giannis",
  basal: [
    {
      name: "Giannis",
      basal: [
        { time: "00:00", value: 0.85 },
        { time: "06:00", value: 0.90 },
        { time: "12:00", value: 0.80 },
        { time: "18:00", value: 0.85 },
      ],
    },
  ],
  targetLow: 100,
  targetHigh: 120,
  units: "mg/dL",
};

export const MOCK_DEVICE_STATUS: DeviceStatus = {
  device: "androidaps",
  created_at: Date.now() - 2 * 60 * 1000,
  dateString: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  loop: {
    COB: MOCK_COB,
    IOB: MOCK_IOB,
    status: "Looping",
    pump: {
      model: "Omnipod DASH",
      basalRate: MOCK_ACTIVE_BASAL,
      battery: 72,
      reservoir: 145,
      reservoirPercent: 82,
      status: "normal",
      clock: new Date().toISOString(),
    },
    enacted: MOCK_TEMP_BASAL_RATE
      ? {
          duration: MOCK_TEMP_BASAL_REMAINING,
          rate: MOCK_TEMP_BASAL_RATE,
          timestamp: Date.now() - 35 * 60 * 1000,
        }
      : undefined,
  },
};

export type AnomalySeverity = "warning" | "critical" | "info";

export interface AnomalyAlert {
  id: string;
  severity: AnomalySeverity;
  title: string;
  detail: string;
  timestamp: number;
}

export const MOCK_ANOMALY_ALERTS: AnomalyAlert[] = [
  {
    id: "alert-001",
    severity: "warning",
    title: "BG rising fast",
    detail: "Glucose up 18 mg/dL in the last 10 min. Consider pre-bolus for upcoming meal.",
    timestamp: Date.now() - 8 * 60 * 1000,
  },
  {
    id: "alert-002",
    severity: "info",
    title: "Temp basal active",
    detail: "Running 1.10 U/h (temp basal) for 30 min. Reason: BG target mode.",
    timestamp: Date.now() - 35 * 60 * 1000,
  },
  {
    id: "alert-003",
    severity: "warning",
    title: "Pump reservoir low",
    detail: "Reservoir at 18%. Recommend changing pod soon.",
    timestamp: Date.now() - 60 * 60 * 1000,
  },
];
