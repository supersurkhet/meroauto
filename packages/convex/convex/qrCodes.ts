import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, requireDriver, requireRider, requireAdmin } from "./lib/auth";

function generateQrCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MA-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Create a QR code for a driver's vehicle */
export const createQrCode = mutation({
  args: {
    driverId: v.id("drivers"),
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, { driverId, vehicleId }) => {
    await requireAdmin(ctx);
    // Deactivate existing QR for this vehicle
    const existing = await ctx.db
      .query("autoQrCodes")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    for (const qr of existing) {
      await ctx.db.patch(qr._id, { isActive: false });
    }

    const qrCode = generateQrCode();
    return await ctx.db.insert("autoQrCodes", {
      driverId,
      vehicleId,
      qrCode,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

/** Look up a QR code → get driver and vehicle info */
export const lookupQrCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, { qrCode }) => {
    const qr = await ctx.db
      .query("autoQrCodes")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", qrCode))
      .unique();

    if (!qr || !qr.isActive) return null;

    const driver = await ctx.db.get(qr.driverId);
    const vehicle = await ctx.db.get(qr.vehicleId);

    if (!driver) return null;

    return {
      qrId: qr._id,
      driver: {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        rating: driver.rating,
        isOnline: driver.isOnline,
        isApproved: driver.isApproved,
      },
      vehicle,
    };
  },
});

/** Get QR code for a driver */
export const getDriverQrCode = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    return await ctx.db
      .query("autoQrCodes")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

/** QR Instant Ride — scan QR, skip matching, create ride directly */
export const createQrRideRequest = mutation({
  args: {
    qrCode: v.string(),
    riderId: v.optional(v.id("riders")),
    pickupLatitude: v.number(),
    pickupLongitude: v.number(),
    pickupAddress: v.string(),
    dropoffLatitude: v.number(),
    dropoffLongitude: v.number(),
    dropoffAddress: v.string(),
    estimatedFare: v.number(),
    estimatedDistance: v.number(),
    paymentMethod: v.optional(
      v.union(v.literal("cash"), v.literal("khalti"), v.literal("esewa"), v.literal("fonepay")),
    ),
  },
  handler: async (ctx, args) => {
    const { riderId: authRiderId } = await requireRider(ctx);
    const riderId = args.riderId ?? authRiderId;

    // Look up QR code
    const qr = await ctx.db
      .query("autoQrCodes")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", args.qrCode))
      .unique();
    if (!qr || !qr.isActive) throw new Error("Invalid or inactive QR code");

    // Check driver is online and available
    const driver = await ctx.db.get(qr.driverId);
    if (!driver) throw new Error("Driver not found");
    if (!driver.isOnline) throw new Error("Driver is currently offline");
    if (!driver.isApproved) throw new Error("Driver not approved");
    if (driver.isSuspended) throw new Error("Driver is suspended");

    // Check driver doesn't have active ride
    const activeRide = await ctx.db
      .query("rides")
      .withIndex("by_driverId", (q) => q.eq("driverId", driver._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "driver_arriving"),
          q.eq(q.field("status"), "driver_arrived"),
          q.eq(q.field("status"), "in_progress"),
        ),
      )
      .first();
    if (activeRide) throw new Error("Driver is currently on another ride");

    // Check rider doesn't have active request/ride
    const existingRequest = await ctx.db
      .query("rideRequests")
      .withIndex("by_riderId", (q) => q.eq("riderId", riderId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "matched"),
        ),
      )
      .first();
    if (existingRequest) throw new Error("You already have an active ride request");

    const vehicle = await ctx.db.get(qr.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    const now = Date.now();
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Create ride directly — skip matching entirely
    const rideId = await ctx.db.insert("rides", {
      // QR rides have no rideRequest — requestId is optional for QR rides
      riderId,
      driverId: driver._id,
      vehicleId: qr.vehicleId,
      pickupLatitude: args.pickupLatitude,
      pickupLongitude: args.pickupLongitude,
      pickupAddress: args.pickupAddress,
      dropoffLatitude: args.dropoffLatitude,
      dropoffLongitude: args.dropoffLongitude,
      dropoffAddress: args.dropoffAddress,
      status: "driver_arriving",
      otp,
      fare: args.estimatedFare,
      distance: args.estimatedDistance,
      isPooling: false,
      isQrRide: true,
      createdAt: now,
    });

    return { rideId, otp, driverName: driver.name, vehicle };
  },
});

/** Deactivate a QR code */
export const deactivateQrCode = mutation({
  args: { qrId: v.id("autoQrCodes") },
  handler: async (ctx, { qrId }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(qrId, { isActive: false });
    return qrId;
  },
});

/** List all QR codes (admin) */
export const listAllQrCodes = query({
  args: {},
  handler: async (ctx) => {
    const codes = await ctx.db.query("autoQrCodes").collect();
    const results = [];
    for (const qr of codes) {
      const driver = await ctx.db.get(qr.driverId);
      const vehicle = await ctx.db.get(qr.vehicleId);
      results.push({
        ...qr,
        driverName: driver?.name,
        vehicleRegistration: vehicle?.registrationNumber,
      });
    }
    return results;
  },
});
