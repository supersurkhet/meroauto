/**
 * Reactive data layer for the admin desktop app.
 *
 * When VITE_CONVEX_URL is set, uses real Convex queries/mutations.
 * Otherwise falls back to local mock data for development.
 *
 * Each exported store is a Svelte writable that components subscribe to.
 * `refresh*()` functions re-fetch from Convex or no-op for mock.
 */
import { writable, derived, get } from "svelte/store";
import { USE_CONVEX, query, mutate } from "$lib/convex";
import {
  mockDrivers, mockVehicles, mockRides, mockLocations,
  mockPricing, mockQrCodes, mockZones, type Driver, type Vehicle,
  type Ride, type DriverLocation, type PricingRule, type QrCode, type Zone,
  type DashboardStats, type HourlyData, type DriverUtilization,
  mockDashboardStats, mockHourlyData, mockDriverUtilization,
} from "./mock-data";

// ── Stores ──────────────────────────────────────────────────────────

export const drivers = writable<Driver[]>(mockDrivers);
export const vehicles = writable<Vehicle[]>(mockVehicles);
export const rides = writable<Ride[]>(mockRides);
export const driverLocations = writable<DriverLocation[]>(mockLocations);
export const pricingRules = writable<PricingRule[]>(mockPricing);
export const qrCodes = writable<QrCode[]>(mockQrCodes);
export const zones = writable<Zone[]>(mockZones);
export const dashboardStats = writable<DashboardStats>(mockDashboardStats);
export const hourlyData = writable<HourlyData[]>(mockHourlyData);
export const driverUtilization = writable<DriverUtilization[]>(mockDriverUtilization);

// Loading / error state
export const loading = writable(false);
export const error = writable<string | null>(null);

// ── Refresh functions (fetch from Convex) ───────────────────────────

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
  } catch (e: any) {
    error.set(e.message ?? "Failed to load dashboard");
  } finally {
    loading.set(false);
  }
}

export async function refreshDrivers() {
  if (!USE_CONVEX) return;
  try {
    const result = await query<Driver[]>("drivers:listAll");
    drivers.set(result);
  } catch (e: any) {
    error.set(e.message);
  }
}

export async function refreshRides(status?: string) {
  if (!USE_CONVEX) return;
  try {
    const args: Record<string, unknown> = { limit: 100 };
    if (status && status !== "all") args.status = status;
    const result = await query<Ride[]>("rides:listAll", args);
    rides.set(result);
  } catch (e: any) {
    error.set(e.message);
  }
}

export async function refreshLocations() {
  if (!USE_CONVEX) return;
  try {
    const result = await query<DriverLocation[]>("locations:allActiveDriverLocations");
    driverLocations.set(result);
  } catch (e: any) {
    error.set(e.message);
  }
}

export async function refreshPricing() {
  if (!USE_CONVEX) return;
  try {
    const result = await query<PricingRule[]>("pricing:listPricingRules");
    pricingRules.set(result);
  } catch (e: any) {
    error.set(e.message);
  }
}

export async function refreshQrCodes() {
  if (!USE_CONVEX) return;
  try {
    const result = await query<QrCode[]>("qr:listAll");
    qrCodes.set(result);
  } catch (e: any) {
    error.set(e.message);
  }
}

export async function refreshZones() {
  if (!USE_CONVEX) return;
  try {
    const result = await query<Zone[]>("zones:listAll");
    zones.set(result);
  } catch (e: any) {
    error.set(e.message);
  }
}

// ── Mutations ───────────────────────────────────────────────────────

/** Approve a driver */
export async function approveDriver(driverId: string) {
  if (USE_CONVEX) {
    await mutate("drivers:approve", { driverId });
    await refreshDrivers();
  } else {
    drivers.update((ds) =>
      ds.map((d) => (d._id === driverId ? { ...d, isApproved: true } : d))
    );
  }
}

/** Suspend or unsuspend a driver */
export async function suspendDriver(driverId: string, suspended: boolean) {
  if (USE_CONVEX) {
    await mutate("drivers:suspend", { driverId, suspended });
    await refreshDrivers();
  } else {
    drivers.update((ds) =>
      ds.map((d) =>
        d._id === driverId
          ? { ...d, isSuspended: suspended, status: suspended ? "offline" : "available" }
          : d
      )
    );
  }
}

/** Update a pricing rule */
export async function updatePricingRule(
  pricingId: string,
  updates: { baseFare?: number; perKmRate?: number; perMinuteRate?: number; minimumFare?: number; surgeMultiplier?: number }
) {
  if (USE_CONVEX) {
    await mutate("pricing:updatePricingRule", { pricingId, ...updates });
    await refreshPricing();
  } else {
    pricingRules.update((ps) =>
      ps.map((p) => (p._id === pricingId ? { ...p, ...updates } : p))
    );
  }
}

/** Create a new pricing rule */
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
      { _id: `p${Date.now()}`, ...args, surgeMultiplier: args.surgeMultiplier ?? 1.0, zoneName: "New Rule", effectiveFrom: Date.now(), createdAt: Date.now() },
    ]);
  }
}

/** Set surge multiplier */
export async function setSurgeMultiplier(zoneId: string | undefined, multiplier: number) {
  if (USE_CONVEX) {
    const args: Record<string, unknown> = { multiplier };
    if (zoneId) args.zoneId = zoneId;
    await mutate("pricing:setSurgeMultiplier", args);
    await refreshPricing();
  } else {
    pricingRules.update((ps) =>
      ps.map((p) => {
        if (zoneId ? p.zoneId === zoneId : !p.zoneId) {
          return { ...p, surgeMultiplier: multiplier };
        }
        return p;
      })
    );
  }
}

/** Generate a QR code for a driver */
export async function generateQrCode(driverId: string, vehicleId: string) {
  if (USE_CONVEX) {
    await mutate("qr:generate", { driverId, vehicleId });
    await refreshQrCodes();
  } else {
    const driver = get(drivers).find((d) => d._id === driverId);
    const vehicle = get(vehicles).find((v) => v._id === vehicleId);
    const code = `MA-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    qrCodes.update((qs) => [
      ...qs,
      {
        _id: `qr${Date.now()}`,
        driverId,
        vehicleId,
        code,
        driverName: driver?.name,
        vehicle: vehicle ? { registrationNumber: vehicle.registrationNumber, type: vehicle.type, color: vehicle.color } : undefined,
        isActive: true,
        scans: 0,
        createdAt: Date.now(),
      },
    ]);
  }
}

/** Deactivate a QR code */
export async function deactivateQrCode(qrId: string) {
  if (USE_CONVEX) {
    await mutate("qr:deactivate", { qrId });
    await refreshQrCodes();
  } else {
    qrCodes.update((qs) =>
      qs.map((q) => (q._id === qrId ? { ...q, isActive: false } : q))
    );
  }
}

/** Create a zone */
export async function createZone(args: {
  name: string;
  nameNe?: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  baseFare: number;
  perKmRate: number;
  minimumFare: number;
}) {
  if (USE_CONVEX) {
    await mutate("zones:create", args);
    await refreshZones();
  } else {
    zones.update((zs) => [
      ...zs,
      {
        _id: `z${Date.now()}`,
        name: args.name,
        nameNe: args.nameNe,
        center: { lat: args.centerLat, lng: args.centerLng },
        radiusKm: args.radiusKm,
        baseFare: args.baseFare,
        perKmRate: args.perKmRate,
        minimumFare: args.minimumFare,
        surgeMultiplier: 1.0,
        isActive: true,
        createdAt: Date.now(),
      },
    ]);
  }
}

/** Update a zone */
export async function updateZone(zoneId: string, updates: Record<string, unknown>) {
  if (USE_CONVEX) {
    await mutate("zones:update", { zoneId, ...updates });
    await refreshZones();
  } else {
    zones.update((zs) => zs.map((z) => (z._id === zoneId ? { ...z, ...updates } : z)));
  }
}

/** Deactivate a zone */
export async function removeZone(zoneId: string) {
  if (USE_CONVEX) {
    await mutate("zones:remove", { zoneId });
    await refreshZones();
  } else {
    zones.update((zs) => zs.map((z) => (z._id === zoneId ? { ...z, isActive: false } : z)));
  }
}

// ── Derived stores ──────────────────────────────────────────────────

export const activeRides = derived(rides, ($rides) =>
  $rides.filter((r) => ["matched", "accepted", "in_progress"].includes(r.status))
);

export const completedRides = derived(rides, ($rides) =>
  $rides.filter((r) => r.status === "completed" || r.status === "rated")
);

/** Daily ride data for charts (derived from rides store) */
export const dailyRideData = derived(rides, ($rides) => {
  const now = Date.now();
  const day = 86400000;
  const days: { date: string; rides: number; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now - i * day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = dayStart.getTime() + day;
    const dayRides = $rides.filter((r) => r.createdAt >= dayStart.getTime() && r.createdAt < dayEnd);
    const dayRevenue = dayRides
      .filter((r) => r.status === "completed" || r.status === "rated")
      .reduce((s, r) => s + (r.finalFare ?? r.fare), 0);
    days.push({
      date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      rides: dayRides.length,
      revenue: dayRevenue,
    });
  }
  return days;
});
