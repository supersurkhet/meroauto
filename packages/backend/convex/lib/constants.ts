/** Surkhet city center coordinates */
export const SURKHET_CENTER = {
  lat: 28.6042,
  lng: 81.6200,
} as const;

/** Default map zoom level */
export const DEFAULT_ZOOM = 14;

/** Matching radius steps in km */
export const RADIUS_STEPS_KM = [2, 5, 10] as const;

/** Ride request expiry in ms (5 minutes) */
export const REQUEST_EXPIRY_MS = 5 * 60 * 1000;

/** Location update interval in ms (5 seconds) */
export const LOCATION_UPDATE_INTERVAL_MS = 5 * 1000;

/** Currency code */
export const CURRENCY = "NPR" as const;

/** Supported payment methods */
export const PAYMENT_METHODS = ["cash", "khalti", "esewa", "fonepay"] as const;

/** Vehicle types */
export const VEHICLE_TYPES = ["auto_rickshaw", "e_rickshaw"] as const;

/** Supported languages */
export const LANGUAGES = ["en", "ne"] as const;
