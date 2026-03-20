/**
 * Types aligned with the backend Convex schema + mock data for development.
 * When VITE_CONVEX_URL is set, real Convex data replaces these.
 */

// ── Types (matching backend schema) ─────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────

const now = Date.now();
const day = 86400000;
function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const driverNames = [
  "Ram Bahadur Thapa", "Sita Kumari Sharma", "Krishna Prasad Oli",
  "Gita Devi Khadka", "Hari Bahadur KC", "Mina Kumari Bista",
  "Rajesh Kumar Yadav", "Sunita Devi Poudel", "Bishnu Prasad Adhikari",
  "Laxmi Devi Regmi", "Mohan Lal Shrestha", "Parbati Kumari Gurung",
];

const riderNames = [
  "Anil Sharma", "Bindu Thapa", "Chetan KC", "Durga Prasad",
  "Ekta Rai", "Farhan Ali", "Ganga Maya", "Hari Om",
];

const surkhetLocations = [
  { name: "Birendranagar Chowk", lat: 28.601, lng: 81.617 },
  { name: "Mangalgadhi", lat: 28.605, lng: 81.621 },
  { name: "Itram", lat: 28.596, lng: 81.612 },
  { name: "Latikoili", lat: 28.590, lng: 81.625 },
  { name: "Nepalgunj Road", lat: 28.608, lng: 81.630 },
  { name: "Surkhet Hospital", lat: 28.603, lng: 81.615 },
  { name: "Bulbuliya", lat: 28.610, lng: 81.620 },
  { name: "Uttarganga", lat: 28.615, lng: 81.618 },
  { name: "Kunathari", lat: 28.620, lng: 81.610 },
  { name: "Ghatgaun", lat: 28.595, lng: 81.608 },
];

const driverStatuses: Driver["status"][] = ["available", "available", "available", "available", "busy", "on_ride", "offline", "offline"];

export const mockDrivers: Driver[] = driverNames.map((name, i) => ({
  _id: `d${i}`,
  userId: `user_d${i}`,
  name,
  email: `${name.split(" ")[0].toLowerCase()}@email.com`,
  phone: `+977-98${rnd(10, 99)}${rnd(10000, 99999)}`,
  licenseNumber: `SU-${rnd(1000, 9999)}-${rnd(10, 99)}`,
  licenseExpiry: now + rnd(30, 365) * day,
  status: driverStatuses[i % driverStatuses.length],
  isApproved: i < 10,
  isSuspended: i === 11,
  rating: +(3.5 + Math.random() * 1.5).toFixed(1),
  totalRides: rnd(50, 500),
  totalEarnings: rnd(25000, 250000),
  currentVehicleId: `v${i}`,
  createdAt: now - rnd(30, 180) * day,
}));

export const mockVehicles: Vehicle[] = mockDrivers.map((d, i) => ({
  _id: `v${i}`,
  driverId: d._id,
  type: (i % 5 === 0 ? "e_rickshaw" : "auto_rickshaw") as Vehicle["type"],
  registrationNumber: `BA ${rnd(1, 9)} PA ${rnd(1000, 9999)}`,
  color: ["Green", "Yellow", "Blue", "Red"][i % 4],
  make: "Bajaj",
  model: ["RE", "Compact", "Maxima"][i % 3],
  seatCapacity: 3,
  isActive: d.isApproved && !d.isSuspended,
  createdAt: d.createdAt,
  driverName: d.name,
}));

const rideStatuses: Ride["status"][] = ["completed", "completed", "completed", "completed", "cancelled", "in_progress", "accepted", "matched"];

export const mockRides: Ride[] = Array.from({ length: 80 }, (_, i) => {
  const pickup = surkhetLocations[i % surkhetLocations.length];
  const dropoff = surkhetLocations[(i + 3) % surkhetLocations.length];
  const status = rideStatuses[i % rideStatuses.length];
  const driver = mockDrivers[i % mockDrivers.length];
  const createdAt = now - rnd(0, 14) * day - rnd(0, day);
  const fare = rnd(50, 300);
  return {
    _id: `r${i}`,
    requestId: `rq${i}`,
    riderId: `rd${i % 8}`,
    driverId: driver._id,
    vehicleId: `v${i % mockDrivers.length}`,
    pickup: { lat: pickup.lat + (Math.random() - 0.5) * 0.005, lng: pickup.lng + (Math.random() - 0.5) * 0.005, address: pickup.name },
    dropoff: { lat: dropoff.lat + (Math.random() - 0.5) * 0.005, lng: dropoff.lng + (Math.random() - 0.5) * 0.005, address: dropoff.name },
    status,
    fare,
    finalFare: status === "completed" ? fare : undefined,
    distance: +(0.5 + Math.random() * 5).toFixed(1),
    duration: status === "completed" ? rnd(5, 25) * 60000 : undefined,
    startedAt: !["requested", "matched", "accepted"].includes(status) ? createdAt + rnd(2, 8) * 60000 : undefined,
    completedAt: status === "completed" ? createdAt + rnd(10, 30) * 60000 : undefined,
    cancelledAt: status === "cancelled" ? createdAt + rnd(3, 10) * 60000 : undefined,
    cancelReason: status === "cancelled" ? "Rider cancelled" : undefined,
    paymentMethod: ["cash", "khalti", "esewa", "fonepay"][i % 4],
    riderName: riderNames[i % riderNames.length],
    driverName: driver.name,
    isQrRide: i % 7 === 0,
    isPooling: i % 5 === 0,
    createdAt,
  };
});

export const mockLocations: DriverLocation[] = mockDrivers
  .filter((d) => d.status !== "offline")
  .map((d, i) => {
    const loc = surkhetLocations[i % surkhetLocations.length];
    return {
      _id: `loc${i}`,
      driverId: d._id,
      lat: loc.lat + (Math.random() - 0.5) * 0.008,
      lng: loc.lng + (Math.random() - 0.5) * 0.008,
      heading: rnd(0, 360),
      speed: rnd(0, 30),
      updatedAt: now - rnd(0, 30000),
      driver: { _id: d._id, status: d.status, rating: d.rating },
      driverName: d.name,
    };
  });

export const mockPricing: PricingRule[] = [
  { _id: "p0", vehicleType: "auto_rickshaw", baseFare: 50, perKmRate: 25, perMinuteRate: 3, minimumFare: 50, surgeMultiplier: 1.0, isDefault: true, zoneName: "Default (Auto Rickshaw)", createdAt: now - 90 * day },
  { _id: "p1", vehicleType: "e_rickshaw", baseFare: 40, perKmRate: 20, perMinuteRate: 2, minimumFare: 40, surgeMultiplier: 1.0, isDefault: true, zoneName: "Default (E-Rickshaw)", createdAt: now - 90 * day },
  { _id: "p2", zoneId: "z0", vehicleType: "auto_rickshaw", baseFare: 40, perKmRate: 20, perMinuteRate: 2, minimumFare: 40, surgeMultiplier: 1.2, zoneName: "Birendranagar Core", createdAt: now - 60 * day },
];

export const mockQrCodes: QrCode[] = mockDrivers.filter((d) => d.isApproved).map((d, i) => ({
  _id: `qr${i}`,
  driverId: d._id,
  vehicleId: `v${i}`,
  code: `MA-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
  driverName: d.name,
  vehicle: mockVehicles[i] ? { registrationNumber: mockVehicles[i].registrationNumber, type: mockVehicles[i].type, color: mockVehicles[i].color } : undefined,
  isActive: !d.isSuspended,
  scans: rnd(0, 50),
  createdAt: d.createdAt + day,
}));

export const mockZones: Zone[] = [
  { _id: "z0", name: "Birendranagar Core", nameNe: "वीरेन्द्रनगर कोर", center: { lat: 28.601, lng: 81.617 }, radiusKm: 3, baseFare: 40, perKmRate: 20, minimumFare: 40, surgeMultiplier: 1.0, isActive: true, createdAt: now - 90 * day },
  { _id: "z1", name: "Latikoili Area", nameNe: "लतिकोइली क्षेत्र", center: { lat: 28.590, lng: 81.625 }, radiusKm: 2, baseFare: 50, perKmRate: 25, minimumFare: 50, surgeMultiplier: 1.0, isActive: true, createdAt: now - 60 * day },
  { _id: "z2", name: "Kunathari", nameNe: "कुनाठारी", center: { lat: 28.620, lng: 81.610 }, radiusKm: 4, baseFare: 50, perKmRate: 25, minimumFare: 50, surgeMultiplier: 1.0, isActive: false, createdAt: now - 30 * day },
];

// ── Aggregate stats ─────────────────────────────────────────────────

const completedMock = mockRides.filter((r) => r.status === "completed" || r.status === "rated");
const activeMock = mockRides.filter((r) => ["matched", "accepted", "in_progress"].includes(r.status));
const todayStart = new Date().setHours(0, 0, 0, 0);
const weekAgo = now - 7 * day;

export const mockDashboardStats: DashboardStats = {
  rides: { total: mockRides.length, today: mockRides.filter((r) => r.createdAt >= todayStart).length, thisWeek: mockRides.filter((r) => r.createdAt >= weekAgo).length, active: activeMock.length, completed: completedMock.length },
  drivers: { total: mockDrivers.length, online: mockDrivers.filter((d) => d.status !== "offline").length, approved: mockDrivers.filter((d) => d.isApproved).length, pendingApproval: mockDrivers.filter((d) => !d.isApproved && !d.isSuspended).length },
  riders: { total: 45 },
  revenue: { today: mockRides.filter((r) => r.createdAt >= todayStart && r.status === "completed").reduce((s, r) => s + r.fare, 0), thisWeek: mockRides.filter((r) => r.createdAt >= weekAgo && r.status === "completed").reduce((s, r) => s + r.fare, 0), total: completedMock.reduce((s, r) => s + r.fare, 0) },
};

export const mockHourlyData: HourlyData[] = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  count: mockRides.filter((r) => new Date(r.createdAt).getHours() === h).length,
}));

export const mockDriverUtilization: DriverUtilization[] = mockDrivers.map((d) => ({
  driverId: d._id,
  driverName: d.name ?? "Unknown",
  status: d.status,
  totalRides: d.totalRides,
  todayRides: rnd(0, 8),
  rating: d.rating,
  earnings: d.totalEarnings,
}));

export const mockPayments: Payment[] = mockRides
  .filter((r) => r.status === "completed" || r.status === "rated")
  .map((r, i) => ({
    _id: `pay${i}`,
    rideId: r._id,
    riderId: r.riderId,
    driverId: r.driverId,
    amount: r.finalFare ?? r.fare,
    method: (r.paymentMethod ?? "cash") as Payment["method"],
    status: (i % 20 === 0 ? "refunded" : i % 15 === 0 ? "failed" : "completed") as Payment["status"],
    transactionId: r.paymentMethod !== "cash" ? `TXN-${rnd(100000, 999999)}` : undefined,
    createdAt: r.completedAt ?? r.createdAt,
    completedAt: r.completedAt,
  }));

export const mockUsers: AdminUser[] = [
  { _id: "u_admin", name: "Admin User", email: "admin@meroauto.com", role: "admin" },
  ...mockDrivers.map((d) => ({ _id: d.userId, name: d.name ?? "Driver", email: d.email ?? "", role: "driver" as const, phone: d.phone })),
  ...Array.from({ length: 8 }, (_, i) => ({
    _id: `rd${i}`,
    name: ["Anil Sharma", "Bindu Thapa", "Chetan KC", "Durga Prasad", "Ekta Rai", "Farhan Ali", "Ganga Maya", "Hari Om"][i],
    email: `rider${i}@email.com`,
    role: "rider" as const,
  })),
];
