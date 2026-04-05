// Nightscout API TypeScript Types
// Covers: BG entries, treatments, profile, devicestatus

// ---------------------------------------------------------------------------
// BG Entries
// ---------------------------------------------------------------------------

export type TrendDirection =
  | "None"
  | "DoubleUp"
  | "SingleUp"
  | "FortyFiveUp"
  | "Flat"
  | "FortyFiveDown"
  | "SingleDown"
  | "DoubleDown"
  | "NotComputable"
  | "RateOutOfRange";

export interface BgEntry {
  /** Sensor glucose value in mg/dL */
  sgv: number;
  /** Trend direction */
  direction: TrendDirection;
  /** Display glucose value (may differ from sgv after calibration) */
  bg?: number;
  /** Raw sensor reading */
  rawbg?: number;
  /** Timestamp (ms since epoch) */
  date: number;
  /** Formatted date string */
  dateString: string;
  /** Device source (e.g. "share2", "xdrip://...) */
  device: string;
  /** Entry type (sgv, mbg, etc.) */
  type: "sgv" | "mbg" | "cal" | "predict";
  /** Filtered value */
  filtered?: number;
  /** Unfiltered value */
  unfiltered?: number;
  /** Noise level (1-4) */
  noise?: number;
  /** Glucose rate of change (mg/dL/min) */
  rate?: number;
}

export interface BgEntryQuery {
  /** Start time (ms since epoch). Defaults to 24h ago. */
  startDate?: number;
  /** End time (ms since epoch). Defaults to now. */
  endDate?: number;
  /** Number of entries to return. Defaults to 100. */
  count?: number;
  /** Include raw data */
  raw?: boolean;
}

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------

export type TreatmentType =
  | "Bolus"
  | "Carb Correction"
  | "Meal Bolus"
  | "Carbs"
  | "Temp Basal"
  | "Suspend Pump"
  | "Resume Pump"
  | "Site Change"
  | "Sensor Change"
  | "Insulin Change"
  | "Note"
  | "Alarm"
  | "Exercise";

export interface Treatment {
  id: string;
  /** Timestamp (ms since epoch) */
  created_at: number;
  /** Formatted date string */
  dateString: string;
  /** Treatment type */
  type: TreatmentType | string;
  /** Insulin units (for boluses and temp basals) */
  insulin?: number;
  /** Carbohydrates in grams */
  carbs?: number;
  /** Duration in minutes (for temp basals) */
  duration?: number;
  /** Absolute rate for temp basals (U/h) */
  absolute?: number;
  /** Percent adjustment for temp basals */
  percent?: number;
  /** Event type (e.g. "Temp Basal", "Bolus", "Carbs") */
  eventType?: string;
  /** Pump state */
  pump?: string;
  /** Notes */
  notes?: string;
  /** Source (e.g. "openaps", "tandem", "manual") */
  device?: string;
  /** Medication (for site/sensor changes) */
  medication?: string;
  /** Carb sources (array of carb values) */
  carbs进来了?: number[];
}

export interface TreatmentQuery {
  /** Start time (ms since epoch) */
  startDate?: number;
  /** End time (ms since epoch) */
  endDate?: number;
  /** Number of entries to return */
  count?: number;
  /** Include event history */
  history?: boolean;
}

// ---------------------------------------------------------------------------
// Profile (Basal rates, targets, etc.)
// ---------------------------------------------------------------------------

export interface BasalProfileEntry {
  /** Start time of the basal segment (HH:MM) */
  time: string;
  /** Basal rate in U/h */
  value: number;
  /** Raw value before rounding */
  raw?: number;
}

export interface BasalProfile {
  name: string;
  /** List of basal segments */
  basal: BasalProfileEntry[];
  /** Default basal rate if no time match */
  defaultBasal?: number;
}

export interface TargetRange {
  /** Start time (HH:MM) */
  time: string;
  /** Low target mg/dL */
  low: number;
  /** High target mg/dL */
  high: number;
  /** Units (mg/dL or mmol/L) */
  units: "mg/dL" | "mmol/L";
}

export interface Profile {
  /** Profile ID */
  id: string;
  /** Default profile name */
  defaultProfile: string;
  /** Profile start time (ms since epoch) */
  startDate?: number;
  /** Basal rate schedule */
  basal?: BasalProfile[];
  /** Target glucose ranges */
  targetLow?: number;
  targetHigh?: number;
  /** Target ranges by time of day */
  target?: TargetRange[];
  /** Carb ratio (g/U) by time of day */
  carbratio?: Array<{ time: string; value: number }>;
  /** Insulin sensitivity (mg/dL/U) by time of day */
  sens?: Array<{ time: string; value: number }>;
  /** Time zone offset (in hours) */
  timezone?: string;
  /** Units preference */
  units?: "mg/dL" | "mmol/L";
  /** Profile duration (ms) */
  duration?: number;
  /** Mills since last profile switch */
  mills?: number;
  /** Profile name */
  profileName?: string;
  /** Age-based values */
  age?: number;
  /** Auto-sens (auto ISF/CR/basal adjustments) */
  autoSens?: boolean;
}

export interface ProfileQuery {
  /** Specific profile to fetch */
  profile?: string;
  /** Include store */
  store?: boolean;
  /** Date for historical profile */
  date?: number;
}

// ---------------------------------------------------------------------------
// Device Status
// ---------------------------------------------------------------------------

export type LoopStatus =
  | "Looping"
  | "Not Looping"
  | "Suspended"
  | "Error"
  | "Unknown";

export interface PumpStatus {
  /** Pump model (e.g. "Omnipod Dash", "Medtronic 780G") */
  model?: string;
  /** Pump serial number */
  serialNumber?: string;
  /** Battery level (%) */
  battery?: number;
  /** Battery status (normal, low, charging) */
  batteryStatus?: string;
  /** Reservoir remaining (U) */
  reservoir?: number;
  /** Reservoir % remaining */
  reservoirPercent?: number;
  /** Current basal rate (U/h) */
  basalRate?: number;
  /** Current basal rate (temporary, U/h) */
  tempBasalRate?: number;
  /** Temp basal remaining (minutes) */
  tempBasalRemaining?: number;
  /** Last bolus (U) */
  lastBolus?: number;
  /** Last bolus time (ms since epoch) */
  lastBolusTime?: number;
  /** Pump status */
  status?: "normal" | "suspended" | "stopped";
  /** Pump clock (ISO string) */
  clock?: string;
}

export interface LoopStatusDetail {
  /** Recommended basal rate (U/h) */
  recommendedBasal?: number;
  /** COB (g) */
  COB?: number;
  /** IOB (U) */
  IOB?: number;
  /** Predicted glucose values */
  predicted?: BgEntry[];
  /** Loop timestamp (ms since epoch) */
  timestamp?: number;
  /** Enacted requested (temp basal applied) */
  enacted?: {
    duration?: number;
    rate?: number;
    timestamp?: number;
  };
  /** Loop status */
  status?: LoopStatus;
  /** Reason for not looping */
  reason?: string;
  /** Pump state */
  pump?: PumpStatus;
  /** Uploader status */
  uploader?: {
    battery?: number;
    status?: string;
    timestamp?: number;
  };
}

export interface DeviceStatus {
  /** Device name / identifier */
  device: string;
  /** Timestamp (ms since epoch) */
  created_at: number;
  /** Formatted date string */
  dateString: string;
  /** OpenAPS / Loop status */
  openaps?: LoopStatusDetail;
  /** Loop pill status */
  loop?: LoopStatusDetail;
  /** nightscout (uploader) status */
  nightscout?: {
    version?: string;
    battery?: number;
    status?: string;
  };
  /** Pump specific status */
  pump?: PumpStatus;
  /** mbg (manual blood glucose) entries */
  mbg?: Array<{
    timestamp: number;
    glucose: number;
  }>;
  /** Upload lag (seconds) */
  uploadLag?: number;
  /** Device type */
  type?: string;
  /** Last calibration */
  calibrations?: Array<{
    timestamp: number;
    slope: number;
    intercept: number;
    scale: number;
  }>;
  /** Sensor status */
  sensor?: {
    code?: string;
    status?: string;
    noisedate?: string;
    inserted?: number;
  };
}

export interface DeviceStatusQuery {
  /** Count of entries */
  count?: number;
  /** Specific device */
  device?: string;
  /** Fields to include */
  fields?: string;
  /** Date filter (ms since epoch) */
  date?: number;
}

// ---------------------------------------------------------------------------
// Client config and response wrappers
// ---------------------------------------------------------------------------

export interface NightscoutConfig {
  url: string;
  token: string;
}

export interface ApiError {
  message: string;
  status?: number;
  endpoint?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  /** Whether the request succeeded (2xx) */
  ok: boolean;
}
