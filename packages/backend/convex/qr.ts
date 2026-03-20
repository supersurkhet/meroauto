import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  requireRole,
  requireAdmin,
  getDriverProfile,
  getRiderProfile,
  generateOtp,
  generateQrCode,
} from "./lib/helpers";

/** Look up a QR code → get driver info */
export const lookup = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const qr = await ctx.db
      .query("autoQrCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    if (!qr || !qr.isActive) return null;

    const driver = await ctx.db.get(qr.driverId);
    if (!driver) return null;

    const user = await ctx.db.get(driver.userId);
    const vehicle = await ctx.db.get(qr.vehicleId);

    return {
      qrId: qr._id,
      driver: {
        _id: driver._id,
        status: driver.status,
        rating: driver.rating,
        isAvailable: driver.status === "available",
      },
      driverName: user?.name,
      vehicle,
    };
  },
});

/** Rider scans QR → creates instant ride (skips matching) */
export const instantRide = mutation({
  args: {
    code: v.string(),
    pickupLat: v.float64(),
    pickupLng: v.float64(),
    pickupAddress: v.string(),
    dropoffLat: v.float64(),
    dropoffLng: v.float64(),
    dropoffAddress: v.string(),
    estimatedFare: v.float64(),
    estimatedDistance: v.float64(),
    paymentMethod: v.union(
      v.literal("cash"),
      v.literal("khalti"),
      v.literal("esewa"),
      v.literal("fonepay"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "rider");
    const rider = await getRiderProfile(ctx, user._id);

    const qr = await ctx.db
      .query("autoQrCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!qr || !qr.isActive) throw new Error("Invalid QR code");

    const driver = await ctx.db.get(qr.driverId);
    if (!driver) throw new Error("Driver not found");
    if (driver.status !== "available") throw new Error("Driver is not available");
    if (!driver.isApproved || driver.isSuspended) throw new Error("Driver unavailable");

    const now = Date.now();
    const otp = generateOtp();

    // Create ride directly — skip matching
    const rideId = await ctx.db.insert("rides", {
      riderId: rider._id,
      driverId: driver._id,
      vehicleId: qr.vehicleId,
      pickup: { lat: args.pickupLat, lng: args.pickupLng, address: args.pickupAddress },
      dropoff: { lat: args.dropoffLat, lng: args.dropoffLng, address: args.dropoffAddress },
      status: "accepted",
      otp,
      fare: args.estimatedFare,
      distance: args.estimatedDistance,
      paymentMethod: args.paymentMethod,
      isQrRide: true,
      isPooling: false,
      createdAt: now,
    });

    // Mark driver as on_ride
    await ctx.db.patch(driver._id, { status: "on_ride" });

    // Record scan
    await ctx.db.patch(qr._id, {
      scans: qr.scans + 1,
      lastScannedAt: now,
    });

    return { rideId, otp };
  },
});

// ── Admin QR management ─────────────────────────────────────────────

/** Generate a new QR code for a driver's vehicle */
export const generate = mutation({
  args: {
    driverId: v.id("drivers"),
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, { driverId, vehicleId }) => {
    await requireAdmin(ctx);

    // Deactivate existing QR for this vehicle
    const existing = await ctx.db
      .query("autoQrCodes")
      .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicleId))
      .collect();
    for (const qr of existing) {
      await ctx.db.patch(qr._id, { isActive: false });
    }

    const code = generateQrCode();
    return await ctx.db.insert("autoQrCodes", {
      code,
      driverId,
      vehicleId,
      isActive: true,
      scans: 0,
      createdAt: Date.now(),
    });
  },
});

/** Deactivate a QR code */
export const deactivate = mutation({
  args: { qrId: v.id("autoQrCodes") },
  handler: async (ctx, { qrId }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(qrId, { isActive: false });
    return qrId;
  },
});

/** List all QR codes (admin) */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const codes = await ctx.db.query("autoQrCodes").collect();
    const results = [];
    for (const qr of codes) {
      const driver = await ctx.db.get(qr.driverId);
      const vehicle = await ctx.db.get(qr.vehicleId);
      const user = driver ? await ctx.db.get(driver.userId) : null;
      results.push({ ...qr, driverName: user?.name, vehicle });
    }
    return results;
  },
});

/** Get QR code for current driver */
export const myQrCode = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    return await ctx.db
      .query("autoQrCodes")
      .withIndex("by_driverId", (q) => q.eq("driverId", driver._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});
