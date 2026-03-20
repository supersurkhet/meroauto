import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  requireRole,
  getRiderProfile,
  haversineDistance,
} from "./lib/helpers";

const RADIUS_STEPS_KM = [2, 5, 10];
const REQUEST_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/** Find nearest available drivers within expanding radius */
export const findNearestDrivers = query({
  args: {
    lat: v.float64(),
    lng: v.float64(),
    radiusKm: v.optional(v.float64()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, { lat, lng, radiusKm = 5, limit = 10 }) => {
    // Get all available driver locations
    const allLocations = await ctx.db
      .query("driverLocations")
      .collect();

    // Join with drivers to check status
    const nearbyDrivers: Array<{
      driverId: typeof allLocations[0]["driverId"];
      distance: number;
      lat: number;
      lng: number;
    }> = [];

    for (const loc of allLocations) {
      const driver = await ctx.db.get(loc.driverId);
      if (!driver || driver.status !== "available" || driver.isSuspended || !driver.isApproved) {
        continue;
      }
      const dist = haversineDistance(lat, lng, loc.lat, loc.lng);
      if (dist <= radiusKm) {
        nearbyDrivers.push({
          driverId: loc.driverId,
          distance: dist,
          lat: loc.lat,
          lng: loc.lng,
        });
      }
    }

    nearbyDrivers.sort((a, b) => a.distance - b.distance);
    return nearbyDrivers.slice(0, limit);
  },
});

/** Create a ride request and attempt matching with expanding radius */
export const requestRide = mutation({
  args: {
    pickupLat: v.float64(),
    pickupLng: v.float64(),
    pickupAddress: v.string(),
    dropoffLat: v.float64(),
    dropoffLng: v.float64(),
    dropoffAddress: v.string(),
    estimatedFare: v.float64(),
    estimatedDistance: v.float64(),
    estimatedDuration: v.float64(),
    paymentMethod: v.union(
      v.literal("cash"),
      v.literal("khalti"),
      v.literal("esewa"),
      v.literal("fonepay"),
    ),
    passengerCount: v.optional(v.float64()),
    isPooling: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "rider");
    const rider = await getRiderProfile(ctx, user._id);
    const now = Date.now();

    // Check for existing pending request
    const existing = await ctx.db
      .query("rideRequests")
      .withIndex("by_riderId", (q) => q.eq("riderId", rider._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (existing) throw new Error("You already have a pending ride request");

    const requestId = await ctx.db.insert("rideRequests", {
      riderId: rider._id,
      pickup: { lat: args.pickupLat, lng: args.pickupLng, address: args.pickupAddress },
      dropoff: { lat: args.dropoffLat, lng: args.dropoffLng, address: args.dropoffAddress },
      estimatedFare: args.estimatedFare,
      estimatedDistance: args.estimatedDistance,
      estimatedDuration: args.estimatedDuration,
      paymentMethod: args.paymentMethod,
      passengerCount: args.passengerCount ?? 1,
      isPooling: args.isPooling ?? false,
      status: "pending",
      matchRadius: RADIUS_STEPS_KM[0],
      createdAt: now,
      expiresAt: now + REQUEST_EXPIRY_MS,
    });

    // Schedule matching attempt
    await ctx.scheduler.runAfter(0, internal.matching.attemptMatch, {
      requestId,
      radiusIndex: 0,
    });

    return requestId;
  },
});

/** Internal: attempt to match a ride request with expanding radius */
export const attemptMatch = internalMutation({
  args: {
    requestId: v.id("rideRequests"),
    radiusIndex: v.float64(),
  },
  handler: async (ctx, { requestId, radiusIndex }) => {
    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "pending") return;
    if (Date.now() > request.expiresAt) {
      await ctx.db.patch(requestId, { status: "expired" });
      return;
    }

    const radius = RADIUS_STEPS_KM[radiusIndex] ?? RADIUS_STEPS_KM[RADIUS_STEPS_KM.length - 1];

    // Find nearest available driver
    const allLocations = await ctx.db.query("driverLocations").collect();
    let bestDriver: { driverId: typeof allLocations[0]["driverId"]; distance: number } | null = null;

    for (const loc of allLocations) {
      const driver = await ctx.db.get(loc.driverId);
      if (!driver || driver.status !== "available" || driver.isSuspended || !driver.isApproved) {
        continue;
      }
      const dist = haversineDistance(
        request.pickup.lat,
        request.pickup.lng,
        loc.lat,
        loc.lng,
      );
      if (dist <= radius && (!bestDriver || dist < bestDriver.distance)) {
        bestDriver = { driverId: loc.driverId, distance: dist };
      }
    }

    if (bestDriver) {
      await ctx.db.patch(requestId, {
        status: "matched",
        matchedDriverId: bestDriver.driverId,
        matchRadius: radius,
      });
      // Mark driver as busy
      await ctx.db.patch(bestDriver.driverId, { status: "busy" });
    } else if (radiusIndex + 1 < RADIUS_STEPS_KM.length) {
      // Expand radius and retry in 3 seconds
      await ctx.db.patch(requestId, { matchRadius: RADIUS_STEPS_KM[radiusIndex + 1] });
      await ctx.scheduler.runAfter(3000, internal.matching.attemptMatch, {
        requestId,
        radiusIndex: radiusIndex + 1,
      });
    } else {
      // No drivers found at max radius — retry in 10 seconds
      await ctx.scheduler.runAfter(10000, internal.matching.attemptMatch, {
        requestId,
        radiusIndex: RADIUS_STEPS_KM.length - 1,
      });
    }
  },
});

/** Cancel a pending ride request */
export const cancelRequest = mutation({
  args: { requestId: v.id("rideRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireRole(ctx, "rider");
    const rider = await getRiderProfile(ctx, user._id);
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.riderId !== rider._id) throw new Error("Not your request");
    if (request.status !== "pending" && request.status !== "matched") {
      throw new Error("Cannot cancel request in current state");
    }

    // If matched, release the driver
    if (request.matchedDriverId) {
      await ctx.db.patch(request.matchedDriverId, { status: "available" });
    }

    await ctx.db.patch(requestId, { status: "cancelled" });
    return requestId;
  },
});

/** Get pending requests for a driver (requests matched to them) */
export const myPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireRole(ctx, "driver");
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (!driver) throw new Error("Driver not found");

    const requests = await ctx.db
      .query("rideRequests")
      .withIndex("by_status", (q) => q.eq("status", "matched"))
      .collect();

    return requests.filter((r) => r.matchedDriverId === driver._id);
  },
});
