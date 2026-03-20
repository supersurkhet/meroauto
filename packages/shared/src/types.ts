// Ride statuses
export type RideRequestStatus =
  | "pending"
  | "matched"
  | "accepted"
  | "expired"
  | "cancelled";

export type RideStatus =
  | "driver_arriving"
  | "driver_arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "khalti" | "esewa" | "fonepay";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type Language = "en" | "ne";

// Coordinates
export interface LatLng {
  latitude: number;
  longitude: number;
}

// Location with address
export interface Location extends LatLng {
  address: string;
}

// Fare estimate
export interface FareEstimate {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  totalFare: number;
  currency: "NPR";
}
