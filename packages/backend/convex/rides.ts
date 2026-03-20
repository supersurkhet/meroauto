import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  getAuthenticatedUser,
  requireRole,
  getDriverProfile,
  getRiderProfile,
  assertTransition,
  generateOtp,
} from "./lib/helpers";

/** Driver accepts a matched ride request → creates a ride */
export const acceptRequest = mutation({
  args: { requestId: v.id("rideRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    const request = await ctx.db.get(requestId);

    if (!request) throw new Error("Request not found");
    if (request.status !== "matched") throw new Error("Request not in matched state");
    if (request.matchedDriverId !== driver._id) throw new Error("Not matched to you");
    if (!driver.currentVehicleId) throw new Error("No vehicle set");

    const vehicle = await ctx.db.get(driver.currentVehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    const now = Date.now();
    const otp = generateOtp();

    const rideId = await ctx.db.insert("rides", {
      requestId,
      riderId: request.riderId,
      driverId: driver._id,
      vehicleId: driver.currentVehicleId,
      pickup: request.pickup,
      dropoff: request.dropoff,
      status: "accepted",
      otp,
      fare: request.estimatedFare,
      distance: request.estimatedDistance,
      paymentMethod: request.paymentMethod,
      isQrRide: false,
      isPooling: request.isPooling,
      createdAt: now,
    });

    await ctx.db.patch(requestId, { status: "matched" });
    await ctx.db.patch(driver._id, { status: "on_ride" });

    return { rideId, otp };
  },
});

/** Driver rejects a matched request — releases it back */
export const rejectRequest = mutation({
  args: { requestId: v.id("rideRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    const request = await ctx.db.get(requestId);

    if (!request || request.matchedDriverId !== driver._id) {
      throw new Error("Invalid request");
    }

    await ctx.db.patch(requestId, {
      status: "pending",
      matchedDriverId: undefined,
    });
    await ctx.db.patch(driver._id, { status: "available" });
    return requestId;
  },
});

/** Driver confirms OTP and starts the ride */
export const startRide = mutation({
  args: {
    rideId: v.id("rides"),
    otp: v.string(),
  },
  handler: async (ctx, { rideId, otp }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    const ride = await ctx.db.get(rideId);

    if (!ride) throw new Error("Ride not found");
    if (ride.driverId !== driver._id) throw new Error("Not your ride");
    if (ride.otp !== otp) throw new Error("Invalid OTP");
    assertTransition(ride.status, "in_progress");

    await ctx.db.patch(rideId, {
      status: "in_progress",
      startedAt: Date.now(),
    });
    return rideId;
  },
});

/** Driver completes the ride */
export const completeRide = mutation({
  args: {
    rideId: v.id("rides"),
    finalDistance: v.optional(v.float64()),
    finalFare: v.optional(v.float64()),
  },
  handler: async (ctx, { rideId, finalDistance, finalFare }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    const ride = await ctx.db.get(rideId);

    if (!ride) throw new Error("Ride not found");
    if (ride.driverId !== driver._id) throw new Error("Not your ride");
    assertTransition(ride.status, "completed");

    const now = Date.now();
    const duration = ride.startedAt ? now - ride.startedAt : undefined;

    await ctx.db.patch(rideId, {
      status: "completed",
      completedAt: now,
      duration,
      finalDistance: finalDistance ?? ride.distance,
      finalFare: finalFare ?? ride.fare,
    });

    // Update driver stats
    await ctx.db.patch(driver._id, {
      status: "available",
      totalRides: driver.totalRides + 1,
      totalEarnings: driver.totalEarnings + (finalFare ?? ride.fare),
    });

    // Update rider stats
    const rider = await ctx.db.get(ride.riderId);
    if (rider) {
      await ctx.db.patch(rider._id, {
        totalRides: rider.totalRides + 1,
      });
    }

    return rideId;
  },
});

/** Cancel an active ride */
export const cancelRide = mutation({
  args: {
    rideId: v.id("rides"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { rideId, reason }) => {
    const user = await getAuthenticatedUser(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
    assertTransition(ride.status, "cancelled");

    await ctx.db.patch(rideId, {
      status: "cancelled",
      cancelledAt: Date.now(),
      cancelReason: reason,
    });

    // Release driver
    const driver = await ctx.db.get(ride.driverId);
    if (driver) {
      await ctx.db.patch(driver._id, { status: "available" });
    }

    return rideId;
  },
});

/** Rate a completed ride */
export const rateRide = mutation({
  args: {
    rideId: v.id("rides"),
    rating: v.float64(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { rideId, rating, comment }) => {
    const user = await getAuthenticatedUser(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.status !== "completed" && ride.status !== "rated") {
      throw new Error("Can only rate completed rides");
    }
    if (rating < 1 || rating > 5) throw new Error("Rating must be 1-5");

    // Determine who is being rated
    const rider = await ctx.db.get(ride.riderId);
    const driver = await ctx.db.get(ride.driverId);
    if (!rider || !driver) throw new Error("Ride participants not found");

    const isRider = rider.userId === user._id;
    const isDriver = driver.userId === user._id;
    if (!isRider && !isDriver) throw new Error("Not a participant in this ride");

    const toUserId = isRider ? driver.userId : rider.userId;

    // Check for duplicate rating
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_rideId", (q) => q.eq("rideId", rideId))
      .filter((q) => q.eq(q.field("fromUserId"), user._id))
      .first();
    if (existing) throw new Error("Already rated this ride");

    await ctx.db.insert("ratings", {
      rideId,
      fromUserId: user._id,
      toUserId,
      rating,
      comment,
      createdAt: Date.now(),
    });

    // Update average rating
    const allRatings = await ctx.db
      .query("ratings")
      .withIndex("by_toUserId", (q) => q.eq("toUserId", toUserId))
      .collect();
    const avgRating =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    if (isRider) {
      await ctx.db.patch(driver._id, { rating: Math.round(avgRating * 10) / 10 });
    } else {
      await ctx.db.patch(rider._id, { rating: Math.round(avgRating * 10) / 10 });
    }

    // Transition ride to rated if both parties rated
    const rideRatings = await ctx.db
      .query("ratings")
      .withIndex("by_rideId", (q) => q.eq("rideId", rideId))
      .collect();
    if (rideRatings.length >= 2) {
      await ctx.db.patch(rideId, { status: "rated" });
    }

    return rideId;
  },
});

// ── Queries ─────────────────────────────────────────────────────────

/** Get current active ride for rider */
export const myActiveRide = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Check if rider
    const rider = await ctx.db
      .query("riders")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (rider) {
      const activeStatuses = ["matched", "accepted", "in_progress"];
      for (const status of activeStatuses) {
        const ride = await ctx.db
          .query("rides")
          .withIndex("by_riderId_status", (q) =>
            q.eq("riderId", rider._id).eq("status", status as any),
          )
          .first();
        if (ride) return ride;
      }
    }

    // Check if driver
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (driver) {
      const activeStatuses = ["matched", "accepted", "in_progress"];
      for (const status of activeStatuses) {
        const ride = await ctx.db
          .query("rides")
          .withIndex("by_driverId_status", (q) =>
            q.eq("driverId", driver._id).eq("status", status as any),
          )
          .first();
        if (ride) return ride;
      }
    }

    return null;
  },
});

/** Get ride by ID with full details */
export const getById = query({
  args: { rideId: v.id("rides") },
  handler: async (ctx, { rideId }) => {
    await getAuthenticatedUser(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) return null;

    const rider = await ctx.db.get(ride.riderId);
    const driver = await ctx.db.get(ride.driverId);
    const vehicle = await ctx.db.get(ride.vehicleId);
    const riderUser = rider ? await ctx.db.get(rider.userId) : null;
    const driverUser = driver ? await ctx.db.get(driver.userId) : null;

    return {
      ...ride,
      rider: { ...rider, user: riderUser },
      driver: { ...driver, user: driverUser },
      vehicle,
    };
  },
});

/** Ride history for current user */
export const myHistory = query({
  args: { limit: v.optional(v.float64()) },
  handler: async (ctx, { limit = 20 }) => {
    const user = await getAuthenticatedUser(ctx);

    const rider = await ctx.db
      .query("riders")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (rider) {
      return await ctx.db
        .query("rides")
        .withIndex("by_riderId", (q) => q.eq("riderId", rider._id))
        .order("desc")
        .take(limit);
    }

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (driver) {
      return await ctx.db
        .query("rides")
        .withIndex("by_driverId", (q) => q.eq("driverId", driver._id))
        .order("desc")
        .take(limit);
    }

    return [];
  },
});

/** Admin: list all rides with filters */
export const listAll = query({
  args: {
    status: v.optional(v.union(
      v.literal("requested"),
      v.literal("matched"),
      v.literal("accepted"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("rated"),
    )),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, { status, limit = 50 }) => {
    const user = await getAuthenticatedUser(ctx);
    if (user.role !== "admin") throw new Error("Admin only");

    if (status) {
      return await ctx.db
        .query("rides")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("rides").order("desc").take(limit);
  },
});
