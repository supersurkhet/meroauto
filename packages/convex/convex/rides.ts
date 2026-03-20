import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/** Driver accepts a matched ride request — creates a ride record */
export const acceptRideRequest = mutation({
  args: { requestId: v.id("rideRequests") },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "matched") throw new Error("Request not in matched state");
    if (!request.matchedDriverId) throw new Error("No driver matched");

    const driver = await ctx.db.get(request.matchedDriverId);
    if (!driver) throw new Error("Driver not found");

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
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
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
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
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
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
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
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
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

    // Update driver stats
    const driver = await ctx.db.get(ride.driverId);
    if (driver) {
      const fare = finalFare ?? ride.fare;
      await ctx.db.patch(driver._id, {
        totalRides: driver.totalRides + 1,
        totalEarnings: driver.totalEarnings + fare,
      });
    }

    // Update rider stats (if we had a totalRides field — schema doesn't have it, skip)
    return rideId;
  },
});

/** Cancel a ride */
export const cancelRide = mutation({
  args: {
    rideId: v.id("rides"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { rideId, reason }) => {
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

    return rideId;
  },
});

// ── Queries ─────────────────────────────────────────────────────────

/** Get active ride for a driver */
export const getActiveRide = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
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
  args: { riderId: v.id("riders") },
  handler: async (ctx, { riderId }) => {
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
    riderId: v.id("riders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { riderId, limit }) => {
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
    driverId: v.id("drivers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { driverId, limit }) => {
    return await ctx.db
      .query("rides")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .order("desc")
      .take(limit ?? 20);
  },
});
