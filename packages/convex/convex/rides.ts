import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, requireDriver, requireRider } from "./lib/auth";

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/** Driver accepts a matched ride request — creates a ride record */
export const acceptRideRequest = mutation({
  args: { requestId: v.id("rideRequests") },
  handler: async (ctx, { requestId }) => {
    const { driverId: authDriverId } = await requireDriver(ctx);

    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "matched") throw new Error("Request not in matched state");
    if (!request.matchedDriverId) throw new Error("No driver matched");
    if (request.matchedDriverId !== authDriverId) throw new Error("Not matched to you");

    const driver = await ctx.db.get(request.matchedDriverId);
    if (!driver) throw new Error("Driver not found");
    if (!driver.isOnline) throw new Error("Driver went offline");
    if (driver.isSuspended) throw new Error("Driver has been suspended");
    if (!driver.isApproved) throw new Error("Driver is not approved");

    // Get driver's active vehicle
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_driverId", (q) => q.eq("driverId", driver._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (!vehicle) throw new Error("No active vehicle for driver");

    const now = Date.now();
    const otp = generateOtp();

    const rideId = await ctx.db.insert("rides", {
      requestId,
      riderId: request.riderId,
      driverId: driver._id,
      vehicleId: vehicle._id,
      pickupLatitude: request.pickupLatitude,
      pickupLongitude: request.pickupLongitude,
      pickupAddress: request.pickupAddress,
      dropoffLatitude: request.dropoffLatitude,
      dropoffLongitude: request.dropoffLongitude,
      dropoffAddress: request.dropoffAddress,
      status: "driver_arriving",
      otp,
      fare: request.estimatedFare,
      distance: request.estimatedDistance,
      isPooling: request.isPooling,
      createdAt: now,
    });

    // Update request status
    await ctx.db.patch(requestId, { status: "accepted" });

    return { rideId, otp };
  },
});

/** Driver indicates they've arrived at pickup */
export const driverArrived = mutation({
  args: { rideId: v.id("rides") },
  handler: async (ctx, { rideId }) => {
    const { driverId } = await requireDriver(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.driverId !== driverId) throw new Error("Not your ride");
    if (ride.status !== "driver_arriving") throw new Error("Invalid state transition");
    await ctx.db.patch(rideId, { status: "driver_arrived" });
    return rideId;
  },
});

/** Verify OTP and start the ride */
export const verifyOtp = mutation({
  args: {
    rideId: v.id("rides"),
    otp: v.string(),
  },
  handler: async (ctx, { rideId, otp }) => {
    const { driverId } = await requireDriver(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.driverId !== driverId) throw new Error("Not your ride");
    if (ride.status !== "driver_arrived") throw new Error("Driver hasn't arrived yet");
    if (ride.otp !== otp) throw new Error("Invalid OTP");

    await ctx.db.patch(rideId, {
      status: "in_progress",
      startedAt: Date.now(),
    });
    return rideId;
  },
});

/** Start the ride (without OTP — for backward compat) */
export const startRide = mutation({
  args: { rideId: v.id("rides") },
  handler: async (ctx, { rideId }) => {
    const { driverId } = await requireDriver(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.driverId !== driverId) throw new Error("Not your ride");
    if (ride.status !== "driver_arrived") throw new Error("Driver hasn't arrived yet");
    await ctx.db.patch(rideId, {
      status: "in_progress",
      startedAt: Date.now(),
    });
    return rideId;
  },
});

/** Complete the ride */
export const completeRide = mutation({
  args: {
    rideId: v.id("rides"),
    finalFare: v.optional(v.number()),
    finalDistance: v.optional(v.number()),
  },
  handler: async (ctx, { rideId, finalFare, finalDistance }) => {
    const { driverId } = await requireDriver(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.driverId !== driverId) throw new Error("Not your ride");
    if (ride.status !== "in_progress") throw new Error("Ride not in progress");

    const now = Date.now();
    const duration = ride.startedAt ? Math.round((now - ride.startedAt) / 1000) : undefined;

    await ctx.db.patch(rideId, {
      status: "completed",
      completedAt: now,
      duration,
      fare: finalFare ?? ride.fare,
      distance: finalDistance ?? ride.distance,
    });

    const actualFare = finalFare ?? ride.fare;

    // Update driver stats
    const driver = await ctx.db.get(ride.driverId);
    if (driver) {
      await ctx.db.patch(driver._id, {
        totalRides: driver.totalRides + 1,
        totalEarnings: driver.totalEarnings + actualFare,
        isOnline: true, // Driver goes back to available after completing
      });
    }

    // If no payment record yet, create a pending one
    const existingPayment = await ctx.db
      .query("payments")
      .withIndex("by_rideId", (q) => q.eq("rideId", rideId))
      .first();
    if (!existingPayment) {
      await ctx.db.insert("payments", {
        rideId,
        riderId: ride.riderId,
        driverId: ride.driverId,
        amount: actualFare,
        method: "cash", // Default to cash if not specified
        status: "pending",
        createdAt: now,
      });
    }

    return rideId;
  },
});

/** Cancel a ride — handles edge cases like driver going offline */
export const cancelRide = mutation({
  args: {
    rideId: v.id("rides"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { rideId, reason }) => {
    await requireAuth(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.status === "completed" || ride.status === "cancelled") {
      throw new Error("Cannot cancel ride in current state");
    }

    await ctx.db.patch(rideId, {
      status: "cancelled",
      cancelledAt: Date.now(),
      cancelReason: reason,
    });

    // Release driver — set back to online if not suspended
    const driver = await ctx.db.get(ride.driverId);
    if (driver && !driver.isSuspended && driver.isApproved) {
      // Only keep online if they still have a recent location update (< 2min)
      const loc = await ctx.db
        .query("driverLocations")
        .withIndex("by_driverId", (q) => q.eq("driverId", ride.driverId))
        .unique();
      const isRecent = loc && (Date.now() - loc.updatedAt) < 2 * 60 * 1000;
      await ctx.db.patch(driver._id, { isOnline: isRecent ?? false });
    }

    // Handle pending payment — mark as failed if exists
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_rideId", (q) => q.eq("rideId", rideId))
      .first();
    if (payment && payment.status === "pending") {
      await ctx.db.patch(payment._id, { status: "failed" });
    }

    return rideId;
  },
});

// ── Queries ─────────────────────────────────────────────────────────

/** Get active ride for a driver */
export const getActiveRide = query({
  args: { driverId: v.optional(v.id("drivers")) },
  handler: async (ctx, { driverId: argDriverId }) => {
    const { driverId: authDriverId } = await requireDriver(ctx);
    const driverId = argDriverId ?? authDriverId;
    for (const status of ["driver_arriving", "driver_arrived", "in_progress"] as const) {
      const ride = await ctx.db
        .query("rides")
        .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
        .filter((q) => q.eq(q.field("status"), status))
        .first();
      if (ride) return ride;
    }
    return null;
  },
});

/** Get active ride for a rider */
export const getActiveRideForRider = query({
  args: { riderId: v.optional(v.id("riders")) },
  handler: async (ctx, { riderId: argRiderId }) => {
    const { riderId: authRiderId } = await requireRider(ctx);
    const riderId = argRiderId ?? authRiderId;
    for (const status of ["driver_arriving", "driver_arrived", "in_progress"] as const) {
      const ride = await ctx.db
        .query("rides")
        .withIndex("by_riderId", (q) => q.eq("riderId", riderId))
        .filter((q) => q.eq(q.field("status"), status))
        .first();
      if (ride) return ride;
    }
    return null;
  },
});

/** Get ride by ID with related data */
export const getRideById = query({
  args: { rideId: v.id("rides") },
  handler: async (ctx, { rideId }) => {
    await requireAuth(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) return null;

    const rider = await ctx.db.get(ride.riderId);
    const driver = await ctx.db.get(ride.driverId);
    const vehicle = await ctx.db.get(ride.vehicleId);

    return { ...ride, rider, driver, vehicle };
  },
});

/** Get rides history for a rider */
export const getRidesByRider = query({
  args: {
    riderId: v.optional(v.id("riders")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { riderId: argRiderId, limit }) => {
    const { riderId: authRiderId } = await requireRider(ctx);
    const riderId = argRiderId ?? authRiderId;
    return await ctx.db
      .query("rides")
      .withIndex("by_riderId", (q) => q.eq("riderId", riderId))
      .order("desc")
      .take(limit ?? 20);
  },
});

/** Get rides history for a driver */
export const getRidesByDriver = query({
  args: {
    driverId: v.optional(v.id("drivers")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { driverId: argDriverId, limit }) => {
    const { driverId: authDriverId } = await requireDriver(ctx);
    const driverId = argDriverId ?? authDriverId;
    return await ctx.db
      .query("rides")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .order("desc")
      .take(limit ?? 20);
  },
});
