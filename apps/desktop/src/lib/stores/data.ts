/**
 * Reactive data layer — wired to Convex backend.
 * All stores initialize empty and are populated via Convex queries.
 */
import { writable, derived, get } from "svelte/store";
import { USE_CONVEX, query, mutate } from "$lib/convex";
import type {
  Driver, Vehicle, Ride, DriverLocation,
  PricingRule, QrCode, Zone, Payment, AdminUser,
  DashboardStats, HourlyData, DriverUtilization, FareEstimate,
} from "./types";

// Re-export types
export type { Driver, Vehicle, Ride, DriverLocation, PricingRule, QrCode, Zone, Payment, AdminUser, DashboardStats, HourlyData, DriverUtilization, FareEstimate };

const emptyStats: DashboardStats = {
  rides: { total: 0, today: 0, thisWeek: 0, active: 0, completed: 0 },
  drivers: { total: 0, online: 0, approved: 0, pendingApproval: 0 },
  riders: { total: 0 },
  revenue: { today: 0, thisWeek: 0, total: 0 },
};

// ── Stores ──────────────────────────────────────────────────────────

export const drivers = writable<Driver[]>([]);
export const vehicles = writable<Vehicle[]>([]);
export const rides = writable<Ride[]>([]);
export const driverLocations = writable<DriverLocation[]>([]);
export const pricingRules = writable<PricingRule[]>([]);
export const qrCodes = writable<QrCode[]>([]);
export const zones = writable<Zone[]>([]);
export const payments = writable<Payment[]>([]);
export const users = writable<AdminUser[]>([]);
export const dashboardStats = writable<DashboardStats>(emptyStats);
export const hourlyData = writable<HourlyData[]>([]);
export const driverUtilization = writable<DriverUtilization[]>([]);

export const loading = writable(false);
export const error = writable<string | null>(null);

// ── Refresh: ALL queries ────────────────────────────────────────────

export async function refreshDashboard() {
  if (!USE_CONVEX) return;
  loading.set(true);
  try {
    const [stats, hourly, util] = await Promise.all([
      query<DashboardStats>("analytics:dashboardStats"),
      query<HourlyData[]>("analytics:ridesByHour", { days: 7 }),
      query<DriverUtilization[]>("analytics:driverUtilization"),
    ]);
    dashboardStats.set(stats);
    hourlyData.set(hourly);
    driverUtilization.set(util);
    error.set(null);
  } catch (e: unknown) {
    error.set(e instanceof Error ? e.message : "Failed to load dashboard");
  } finally {
    loading.set(false);
  }
}

export async function refreshDrivers(status?: string) {
  if (!USE_CONVEX) return;
  try {
    const args: Record<string, unknown> = {};
    if (status && status !== "all") args.status = status;
    const result = await query<Driver[]>("drivers:listAll", args);
    drivers.set(result);
  } catch (e: unknown) {
    error.set(e instanceof Error ? e.message : "Failed to load drivers");
  }
}

export async function refreshVehicles() {
  if (!USE_CONVEX) return;
  try {
    const result = await query<Vehicle[]>("vehicles:listAll");
    vehicles.set(result);
  } catch (e: unknown) {
    error.set(e instanceof Error ? e.message : "Failed to load vehicles");
  }
}

export async function refreshRides(status?: string) {
  if (!USE_CONVEX) return;
  try {
    const args: Record<string, unknown> = { limit: 200 };
    if (status && status !== "all") args.status = status;
    const result = await query<Ride[]>("rides:listAll", args);
    rides.set(result);
  } catch (e: unknown) {
    error.set(e instanceof Error ? e.message : "Failed to load rides");
  }
}

export async function refreshLocations() {
  if (!USE_CONVEX) return;
  try {
    const result = await query<DriverLocation[]>("locations:allActiveDriverLocations");
    driverLocations.set(result);
  } catch (e: unknown) {
    error.set(e instanceof Error ? e.message : "Failed to load locations");
  }
}

export async function refreshPricing() {
  if (!USE_CONVEX) return;
  try {
    const result = await query<PricingRule[]>("pricing:listPricingRules");
    pricingRules.set(result);
  } catch (e: unknown) {
    error.set(e instanceof Error ? e.message : "Failed to load pricing");
  }
}

export async function refreshQrCodes() {
  if (!USE_CONVEX) return;
  try {
    const result = await query<QrCode[]>("qr:listAll");
    qrCodes.set(result);
  } catch (e: unknown) {
    error.set(e instanceof Error ? e.message : "Failed to load QR codes");
  }
}

export async function refreshZones() {
  if (!USE_CONVEX) return;
  try {
    const result = await query<Zone[]>("zones:listAll");
    zones.set(result);
  } catch (e: unknown) {
    error.set(e instanceof Error ? e.message : "Failed to load zones");
  }
}

export async function refreshPayments(status?: string) {
  if (!USE_CONVEX) return;
  try {
    const args: Record<string, unknown> = { limit: 200 };
    if (status && status !== "all") args.status = status;
    const result = await query<Payment[]>("payments:listAll", args);
    payments.set(result);
  } catch (e: unknown) {
    error.set(e instanceof Error ? e.message : "Failed to load payments");
  }
}

export async function refreshUsers(role?: string) {
  if (!USE_CONVEX) return;
  try {
    const args: Record<string, unknown> = {};
    if (role && role !== "all") args.role = role;
    const result = await query<AdminUser[]>("users:listByRole", args);
    users.set(result);
  } catch (e: unknown) {
    error.set(e instanceof Error ? e.message : "Failed to load users");
  }
}

/** Refresh ALL stores at once */
export async function refreshAll() {
  await Promise.all([
    refreshDashboard(),
    refreshDrivers(),
    refreshVehicles(),
    refreshRides(),
    refreshLocations(),
    refreshPricing(),
    refreshQrCodes(),
    refreshZones(),
    refreshPayments(),
  ]);
}

// ── Mutations: Drivers ──────────────────────────────────────────────

export async function approveDriver(driverId: string) {
  await mutate("drivers:approve", { driverId });
  await refreshDrivers();
}

export async function suspendDriver(driverId: string, suspended: boolean) {
  await mutate("drivers:suspend", { driverId, suspended });
  await refreshDrivers();
}

export async function getDriverById(driverId: string) {
  return await query<Driver & { user?: AdminUser; vehicle?: Vehicle }>("drivers:getById", { driverId });
}

// ── Mutations: Pricing ──────────────────────────────────────────────

export async function updatePricingRule(
  pricingId: string,
  updates: { baseFare?: number; perKmRate?: number; perMinuteRate?: number; minimumFare?: number; surgeMultiplier?: number }
) {
  await mutate("pricing:updatePricingRule", { pricingId, ...updates });
  await refreshPricing();
}

export async function createPricingRule(args: {
  zoneId?: string;
  vehicleType: string;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  surgeMultiplier?: number;
  isDefault?: boolean;
}) {
  await mutate("pricing:createPricingRule", args);
  await refreshPricing();
}

export async function setSurgeMultiplier(zoneId: string | undefined, multiplier: number) {
  const args: Record<string, unknown> = { multiplier };
  if (zoneId) args.zoneId = zoneId;
  await mutate("pricing:setSurgeMultiplier", args);
  await refreshPricing();
}

export async function estimateFare(pickupLat: number, pickupLng: number, dropoffLat: number, dropoffLng: number, vehicleType?: string): Promise<FareEstimate> {
  const args: Record<string, unknown> = { pickupLat, pickupLng, dropoffLat, dropoffLng };
  if (vehicleType) args.vehicleType = vehicleType;
  return await query<FareEstimate>("pricing:estimateFare", args);
}

// ── Mutations: QR Codes ─────────────────────────────────────────────

export async function generateQrCode(driverId: string, vehicleId: string) {
  await mutate("qr:generate", { driverId, vehicleId });
  await refreshQrCodes();
}

export async function deactivateQrCode(qrId: string) {
  await mutate("qr:deactivate", { qrId });
  await refreshQrCodes();
}

// ── Mutations: Zones ────────────────────────────────────────────────

export async function createZone(args: {
  name: string; nameNe?: string; centerLat: number; centerLng: number;
  radiusKm: number; baseFare: number; perKmRate: number; minimumFare: number;
}) {
  await mutate("zones:create", args);
  await refreshZones();
}

export async function updateZone(zoneId: string, updates: Record<string, unknown>) {
  await mutate("zones:update", { zoneId, ...updates });
  await refreshZones();
}

export async function removeZone(zoneId: string) {
  await mutate("zones:remove", { zoneId });
  await refreshZones();
}

// ── Mutations: Payments ─────────────────────────────────────────────

export async function refundPayment(paymentId: string) {
  await mutate("payments:refundPayment", { paymentId });
  await refreshPayments();
}

// ── Mutations: Users ────────────────────────────────────────────────

export async function setUserRole(userId: string, role: "rider" | "driver" | "admin") {
  await mutate("users:setRole", { userId, role });
  await refreshUsers();
}

// ── Mutations: Seed ─────────────────────────────────────────────────

export async function seedDefaults() {
  await mutate("seed:seedDefaults", {});
  await refreshAll();
}

// ── Derived stores ──────────────────────────────────────────────────

export const activeRides = derived(rides, ($rides) =>
  $rides.filter((r) => ["matched", "accepted", "in_progress"].includes(r.status))
);

export const completedRides = derived(rides, ($rides) =>
  $rides.filter((r) => r.status === "completed" || r.status === "rated")
);

export const pendingDrivers = derived(drivers, ($drivers) =>
  $drivers.filter((d) => !d.isApproved && !d.isSuspended)
);

export const onlineDrivers = derived(drivers, ($drivers) =>
  $drivers.filter((d) => d.status !== "offline")
);

export const dailyRideData = derived(rides, ($rides) => {
  const now = Date.now();
  const day = 86400000;
  const days: { date: string; rides: number; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now - i * day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = dayStart.getTime() + day;
    const dayRides = $rides.filter((r) => r.createdAt >= dayStart.getTime() && r.createdAt < dayEnd);
    const dayRevenue = dayRides.filter((r) => r.status === "completed" || r.status === "rated").reduce((s, r) => s + (r.finalFare ?? r.fare), 0);
    days.push({ date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }), rides: dayRides.length, revenue: dayRevenue });
  }
  return days;
});

export const paymentStats = derived(payments, ($payments) => {
  const completed = $payments.filter((p) => p.status === "completed");
  const totalRevenue = completed.reduce((s, p) => s + p.amount, 0);
  const byMethod = { cash: 0, khalti: 0, esewa: 0, fonepay: 0 };
  completed.forEach((p) => { byMethod[p.method] += p.amount; });
  return { totalRevenue, totalTransactions: completed.length, pending: $payments.filter((p) => p.status === "pending").length, failed: $payments.filter((p) => p.status === "failed").length, refunded: $payments.filter((p) => p.status === "refunded").length, byMethod };
});
