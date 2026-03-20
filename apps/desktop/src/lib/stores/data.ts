/**
 * Reactive data layer — 100% wired to Convex backend.
 *
 * VITE_CONVEX_URL set → real Convex queries/mutations
 * VITE_CONVEX_URL unset → local mock data for development
 */
import { writable, derived, get } from "svelte/store";
import { USE_CONVEX, query, mutate } from "$lib/convex";
import {
  mockDrivers, mockVehicles, mockRides, mockLocations,
  mockPricing, mockQrCodes, mockZones, mockPayments, mockUsers,
  mockDashboardStats, mockHourlyData, mockDriverUtilization,
  type Driver, type Vehicle, type Ride, type DriverLocation,
  type PricingRule, type QrCode, type Zone, type Payment, type AdminUser,
  type DashboardStats, type HourlyData, type DriverUtilization, type FareEstimate,
} from "./mock-data";

// Re-export types
export type { Driver, Vehicle, Ride, DriverLocation, PricingRule, QrCode, Zone, Payment, AdminUser, DashboardStats, HourlyData, DriverUtilization, FareEstimate };

// ── Stores ──────────────────────────────────────────────────────────

export const drivers = writable<Driver[]>(mockDrivers);
export const vehicles = writable<Vehicle[]>(mockVehicles);
export const rides = writable<Ride[]>(mockRides);
export const driverLocations = writable<DriverLocation[]>(mockLocations);
export const pricingRules = writable<PricingRule[]>(mockPricing);
export const qrCodes = writable<QrCode[]>(mockQrCodes);
export const zones = writable<Zone[]>(mockZones);
export const payments = writable<Payment[]>(mockPayments);
export const users = writable<AdminUser[]>(mockUsers);
export const dashboardStats = writable<DashboardStats>(mockDashboardStats);
export const hourlyData = writable<HourlyData[]>(mockHourlyData);
export const driverUtilization = writable<DriverUtilization[]>(mockDriverUtilization);

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
  if (USE_CONVEX) {
    await mutate("drivers:approve", { driverId });
    await refreshDrivers();
  } else {
    drivers.update((ds) => ds.map((d) => (d._id === driverId ? { ...d, isApproved: true } : d)));
  }
}

export async function suspendDriver(driverId: string, suspended: boolean) {
  if (USE_CONVEX) {
    await mutate("drivers:suspend", { driverId, suspended });
    await refreshDrivers();
  } else {
    drivers.update((ds) =>
      ds.map((d) => d._id === driverId ? { ...d, isSuspended: suspended, status: suspended ? "offline" as const : "available" as const } : d)
    );
  }
}

export async function getDriverById(driverId: string) {
  if (USE_CONVEX) {
    return await query<Driver & { user?: AdminUser; vehicle?: Vehicle }>("drivers:getById", { driverId });
  }
  return get(drivers).find((d) => d._id === driverId) ?? null;
}

// ── Mutations: Pricing ──────────────────────────────────────────────

export async function updatePricingRule(
  pricingId: string,
  updates: { baseFare?: number; perKmRate?: number; perMinuteRate?: number; minimumFare?: number; surgeMultiplier?: number }
) {
  if (USE_CONVEX) {
    await mutate("pricing:updatePricingRule", { pricingId, ...updates });
    await refreshPricing();
  } else {
    pricingRules.update((ps) => ps.map((p) => (p._id === pricingId ? { ...p, ...updates } : p)));
  }
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
  if (USE_CONVEX) {
    await mutate("pricing:createPricingRule", args);
    await refreshPricing();
  } else {
    pricingRules.update((ps) => [
      ...ps,
      { _id: `p${Date.now()}`, ...args, surgeMultiplier: args.surgeMultiplier ?? 1.0, zoneName: "New Rule", createdAt: Date.now() },
    ]);
  }
}

export async function setSurgeMultiplier(zoneId: string | undefined, multiplier: number) {
  if (USE_CONVEX) {
    const args: Record<string, unknown> = { multiplier };
    if (zoneId) args.zoneId = zoneId;
    await mutate("pricing:setSurgeMultiplier", args);
    await refreshPricing();
  } else {
    pricingRules.update((ps) =>
      ps.map((p) => (zoneId ? p.zoneId === zoneId : !p.zoneId) ? { ...p, surgeMultiplier: multiplier } : p)
    );
  }
}

export async function estimateFare(pickupLat: number, pickupLng: number, dropoffLat: number, dropoffLng: number, vehicleType?: string): Promise<FareEstimate> {
  if (USE_CONVEX) {
    const args: Record<string, unknown> = { pickupLat, pickupLng, dropoffLat, dropoffLng };
    if (vehicleType) args.vehicleType = vehicleType;
    return await query<FareEstimate>("pricing:estimateFare", args);
  }
  const dist = Math.sqrt((pickupLat - dropoffLat) ** 2 + (pickupLng - dropoffLng) ** 2) * 111;
  const dur = (dist / 20) * 60;
  const fare = Math.round(50 + dist * 25 + dur * 3);
  return { fare, distance: Math.round(dist * 100) / 100, estimatedDuration: Math.round(dur), surgeMultiplier: 1, zone: null, breakdown: { baseFare: 50, distanceCharge: Math.round(dist * 25), timeCharge: Math.round(dur * 3), surgeCharge: 0 } };
}

// ── Mutations: QR Codes ─────────────────────────────────────────────

export async function generateQrCode(driverId: string, vehicleId: string) {
  if (USE_CONVEX) {
    await mutate("qr:generate", { driverId, vehicleId });
    await refreshQrCodes();
  } else {
    const driver = get(drivers).find((d) => d._id === driverId);
    const vehicle = get(vehicles).find((v) => v._id === vehicleId);
    const code = `MA-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    qrCodes.update((qs) => [...qs, {
      _id: `qr${Date.now()}`, driverId, vehicleId, code,
      driverName: driver?.name,
      vehicle: vehicle ? { registrationNumber: vehicle.registrationNumber, type: vehicle.type, color: vehicle.color } : undefined,
      isActive: true, scans: 0, createdAt: Date.now(),
    }]);
  }
}

export async function deactivateQrCode(qrId: string) {
  if (USE_CONVEX) {
    await mutate("qr:deactivate", { qrId });
    await refreshQrCodes();
  } else {
    qrCodes.update((qs) => qs.map((q) => (q._id === qrId ? { ...q, isActive: false } : q)));
  }
}

// ── Mutations: Zones ────────────────────────────────────────────────

export async function createZone(args: {
  name: string; nameNe?: string; centerLat: number; centerLng: number;
  radiusKm: number; baseFare: number; perKmRate: number; minimumFare: number;
}) {
  if (USE_CONVEX) {
    await mutate("zones:create", args);
    await refreshZones();
  } else {
    zones.update((zs) => [...zs, {
      _id: `z${Date.now()}`, name: args.name, nameNe: args.nameNe,
      center: { lat: args.centerLat, lng: args.centerLng },
      radiusKm: args.radiusKm, baseFare: args.baseFare, perKmRate: args.perKmRate,
      minimumFare: args.minimumFare, surgeMultiplier: 1.0, isActive: true, createdAt: Date.now(),
    }]);
  }
}

export async function updateZone(zoneId: string, updates: Record<string, unknown>) {
  if (USE_CONVEX) {
    await mutate("zones:update", { zoneId, ...updates });
    await refreshZones();
  } else {
    zones.update((zs) => zs.map((z) => (z._id === zoneId ? { ...z, ...updates } : z)));
  }
}

export async function removeZone(zoneId: string) {
  if (USE_CONVEX) {
    await mutate("zones:remove", { zoneId });
    await refreshZones();
  } else {
    zones.update((zs) => zs.map((z) => (z._id === zoneId ? { ...z, isActive: false } : z)));
  }
}

// ── Mutations: Payments ─────────────────────────────────────────────

export async function refundPayment(paymentId: string) {
  if (USE_CONVEX) {
    await mutate("payments:refundPayment", { paymentId });
    await refreshPayments();
  } else {
    payments.update((ps) => ps.map((p) => (p._id === paymentId ? { ...p, status: "refunded" as const } : p)));
  }
}

// ── Mutations: Users ────────────────────────────────────────────────

export async function setUserRole(userId: string, role: "rider" | "driver" | "admin") {
  if (USE_CONVEX) {
    await mutate("users:setRole", { userId, role });
    await refreshUsers();
  } else {
    users.update((us) => us.map((u) => (u._id === userId ? { ...u, role } : u)));
  }
}

// ── Mutations: Seed ─────────────────────────────────────────────────

export async function seedDefaults() {
  if (USE_CONVEX) {
    await mutate("seed:seedDefaults", {});
    await refreshAll();
  }
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
