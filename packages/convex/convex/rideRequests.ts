import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  validateCoordinates,
  validateNonEmpty,
  validateFare,
  validateDistance,
} from "./lib/validators";
import { requireAuth, requireRider, requireDriver } from "./lib/auth";

const RIDE_REQUEST_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export const createRideRequest = mutation({
  args: {
    riderId: v.optional(v.id("riders")),
    pickupLatitude: v.number(),
    pickupLongitude: v.number(),
    pickupAddress: v.string(),
    dropoffLatitude: v.number(),
    dropoffLongitude: v.number(),
    dropoffAddress: v.string(),
    estimatedFare: v.number(),
    estimatedDistance: v.number(),
    estimatedDuration: v.number(),
    isPooling: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Auth: get rider from authenticated user
    const { riderId: authRiderId } = await requireRider(ctx);
    const riderId = args.riderId ?? authRiderId;

    // Validate inputs
    validateCoordinates(args.pickupLatitude, args.pickupLongitude);
    validateCoordinates(args.dropoffLatitude, args.dropoffLongitude);
    validateNonEmpty(args.pickupAddress, "pickupAddress");
    validateNonEmpty(args.dropoffAddress, "dropoffAddress");
    validateFare(args.estimatedFare);
    validateDistance(args.estimatedDistance);
    if (args.estimatedDuration < 0) throw new Error("Duration cannot be negative");

    // Check for existing active request
    const existing = await ctx.db
      .query("rideRequests")
      .withIndex("by_riderId", (q) => q.eq("riderId", riderId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "matched"),
        ),
      )
      .first();
    if (existing) throw new Error("You already have an active ride request");

    const now = Date.now();
    const requestId = await ctx.db.insert("rideRequests", {
      riderId,
      pickupLatitude: args.pickupLatitude,
      pickupLongitude: args.pickupLongitude,
      pickupAddress: args.pickupAddress,
      dropoffLatitude: args.dropoffLatitude,
      dropoffLongitude: args.dropoffLongitude,
      dropoffAddress: args.dropoffAddress,
      estimatedFare: args.estimatedFare,
      estimatedDistance: args.estimatedDistance,
      estimatedDuration: args.estimatedDuration,
      status: "pending",
      searchRadius: 2,
      isPooling: args.isPooling ?? false,
      createdAt: now,
      expiresAt: now + RIDE_REQUEST_EXPIRY_MS,
    });

    // Schedule matching
    await ctx.scheduler.runAfter(0, internal.matching.matchDriver, {
      requestId,
      radiusIndex: 0,
    });

    // Schedule auto-expiry
    await ctx.scheduler.runAfter(
      RIDE_REQUEST_EXPIRY_MS,
      internal.rideRequests.autoExpireRequest,
      { requestId },
    );

    return requestId;
  },
});

export const cancelRideRequest = mutation({
  args: { requestId: v.id("rideRequests") },
  handler: async (ctx, { requestId }) => {
    await requireAuth(ctx);
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "pending" && request.status !== "matched") {
      throw new Error("Cannot cancel request in current state");
    }

    // Release matched driver
    if (request.matchedDriverId) {
      const driver = await ctx.db.get(request.matchedDriverId);
      if (driver) {
        await ctx.db.patch(request.matchedDriverId, { isOnline: true });
      }
    }

    await ctx.db.patch(requestId, { status: "cancelled" });
    return requestId;
  },
});

export const expireRideRequest = internalMutation({
  args: { requestId: v.id("rideRequests") },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "pending") return;
    await ctx.db.patch(requestId, { status: "expired" });
  },
});

/** Scheduled auto-expire — runs after RIDE_REQUEST_EXPIRY_MS */
export const autoExpireRequest = internalMutation({
  args: { requestId: v.id("rideRequests") },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    if (!request) return;
    // Only expire if still pending or matched (not accepted/cancelled)
    if (request.status === "pending" || request.status === "matched") {
      // Release matched driver if any
      if (request.matchedDriverId) {
        const driver = await ctx.db.get(request.matchedDriverId);
        if (driver && !driver.isSuspended) {
          // Don't reset isOnline — driver stays online, just freed up
        }
      }
      await ctx.db.patch(requestId, { status: "expired" });
    }
  },
});

export const getRideRequestById = query({
  args: { requestId: v.id("rideRequests") },
  handler: async (ctx, { requestId }) => {
    await requireAuth(ctx);
    return await ctx.db.get(requestId);
  },
});

export const getActiveRequestForRider = query({
  args: { riderId: v.optional(v.id("riders")) },
  handler: async (ctx, { riderId: argRiderId }) => {
    const { riderId: authRiderId } = await requireRider(ctx);
    const riderId = argRiderId ?? authRiderId;
    // Check pending first, then matched
    for (const status of ["pending", "matched", "accepted"] as const) {
      const request = await ctx.db
        .query("rideRequests")
        .withIndex("by_riderId", (q) => q.eq("riderId", riderId))
        .filter((q) => q.eq(q.field("status"), status))
        .first();
      if (request) return request;
    }
    return null;
  },
});

export const getPendingRequestsForDriver = query({
  args: { driverId: v.optional(v.id("drivers")) },
  handler: async (ctx, { driverId: argDriverId }) => {
    const { driverId: authDriverId } = await requireDriver(ctx);
    const driverId = argDriverId ?? authDriverId;
    return await ctx.db
      .query("rideRequests")
      .withIndex("by_matchedDriverId", (q) => q.eq("matchedDriverId", driverId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();
  },
});
