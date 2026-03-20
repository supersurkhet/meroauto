/**
 * Types aligned with the backend Convex schema.
 */

export interface Driver {
  _id: string;
  userId: string;
  licenseNumber: string;
  licenseExpiry: number;
  status: "offline" | "available" | "busy" | "on_ride";
  isApproved: boolean;
  isSuspended: boolean;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  currentVehicleId?: string;
  createdAt: number;
  name?: string;
  email?: string;
  phone?: string;
}

export interface Vehicle {
  _id: string;
  driverId: string;
  type: "auto_rickshaw" | "e_rickshaw";
  registrationNumber: string;
  color?: string;
  make?: string;
  model?: string;
  year?: number;
  seatCapacity: number;
  isActive: boolean;
  insuranceExpiry?: number;
  createdAt: number;
  driverName?: string;
}

export interface Ride {
  _id: string;
  requestId?: string;
  riderId: string;
  driverId: string;
  vehicleId: string;
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  status: "requested" | "matched" | "accepted" | "in_progress" | "completed" | "cancelled" | "rated";
  otp?: string;
  fare: number;
  finalFare?: number;
  distance: number;
  finalDistance?: number;
  duration?: number;
  startedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  cancelReason?: string;
  paymentMethod?: string;
  isQrRide: boolean;
  isPooling: boolean;
  createdAt: number;
  riderName?: string;
  driverName?: string;
}

export interface DriverLocation {
  _id: string;
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: number;
  driver?: { _id: string; status: string; rating: number };
  driverName?: string;
}

export interface PricingRule {
  _id: string;
  zoneId?: string;
  vehicleType?: string;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  surgeMultiplier: number;
  isDefault?: boolean;
  effectiveFrom?: number;
  createdAt: number;
  zoneName?: string;
}

export interface QrCode {
  _id: string;
  driverId: string;
  vehicleId: string;
  code: string;
  isActive: boolean;
  scans: number;
  lastScannedAt?: number;
  createdAt: number;
  driverName?: string;
  vehicle?: { registrationNumber: string; type: string; color?: string };
}

export interface Zone {
  _id: string;
  name: string;
  nameNe?: string;
  center: { lat: number; lng: number };
  radiusKm: number;
  boundary?: { lat: number; lng: number }[];
  baseFare?: number;
  perKmRate?: number;
  minimumFare?: number;
  surgeMultiplier?: number;
  isActive: boolean;
  createdAt: number;
}

export interface DashboardStats {
  rides: { total: number; today: number; thisWeek: number; active: number; completed: number };
  drivers: { total: number; online: number; approved: number; pendingApproval: number };
  riders: { total: number };
  revenue: { today: number; thisWeek: number; total: number };
}

export interface HourlyData {
  hour: number;
  count: number;
}

export interface DriverUtilization {
  driverId: string;
  driverName: string;
  status: string;
  totalRides: number;
  todayRides: number;
  rating: number;
  earnings: number;
}

export interface Payment {
  _id: string;
  rideId: string;
  riderId: string;
  driverId: string;
  amount: number;
  method: "cash" | "khalti" | "esewa" | "fonepay";
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId?: string;
  createdAt: number;
  completedAt?: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "rider" | "driver" | "admin";
  phone?: string;
  avatarUrl?: string;
  preferredLanguage?: "en" | "ne";
  createdAt?: number;
}

export interface FareEstimate {
  fare: number;
  distance: number;
  estimatedDuration: number;
  surgeMultiplier: number;
  zone: string | null;
  breakdown: { baseFare: number; distanceCharge: number; timeCharge: number; surgeCharge: number };
}
