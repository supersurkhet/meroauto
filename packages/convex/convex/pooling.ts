import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";

const EARTH_RADIUS_KM = 6371;
function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

const PICKUP_RADIUS_KM = 1;
const DROPOFF_RADIUS_KM = 2;

/** Find active rides with similar routes that can be pooled */
export const findPoolableRides = query({
  args: {
    pickupLatitude: v.number(),
    pickupLongitude: v.number(),
    dropoffLatitude: v.number(),
    dropoffLongitude: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    // Find rides that are in_progress or driver_arriving with isPooling=true
    const activeRides = await ctx.db
      .query("rides")
      .filter((q) =>
        q.and(
          q.eq(q.field("isPooling"), true),
          q.or(
            q.eq(q.field("status"), "driver_arriving"),
            q.eq(q.field("status"), "in_progress"),
          ),
        ),
      )
      .collect();

    const poolable = [];

    for (const ride of activeRides) {
      // Check vehicle capacity
      const vehicle = await ctx.db.get(ride.vehicleId);
      if (!vehicle) continue;

      // Count existing pool riders
      const existingPoolRiders = await ctx.db
        .query("poolRiders")
        .withIndex("by_rideId", (q) => q.eq("rideId", ride._id))
        .collect();

      // Original rider + pool riders must be under capacity
      if (existingPoolRiders.length + 1 >= vehicle.capacity) continue;

      // Check pickup proximity (within 1km)
      const pickupDist = haversineDistance(
        args.pickupLatitude,
        args.pickupLongitude,
        ride.pickupLatitude,
        ride.pickupLongitude,
      );
      if (pickupDist > PICKUP_RADIUS_KM) continue;

      // Check dropoff proximity (within 2km)
      const dropoffDist = haversineDistance(
        args.dropoffLatitude,
        args.dropoffLongitude,
        ride.dropoffLatitude,
        ride.dropoffLongitude,
      );
      if (dropoffDist > DROPOFF_RADIUS_KM) continue;

      const driver = await ctx.db.get(ride.driverId);
      const rider = await ctx.db.get(ride.riderId);

      poolable.push({
        rideId: ride._id,
        driverName: driver?.name ?? "Unknown",
        driverRating: driver?.rating ?? 5,
        vehicleModel: vehicle.model,
        vehicleColor: vehicle.color,
        currentRiders: existingPoolRiders.length + 1,
        maxCapacity: vehicle.capacity,
        pickupDistance: Math.round(pickupDist * 100) / 100,
        dropoffDistance: Math.round(dropoffDist * 100) / 100,
        estimatedFareDiscount: 0.3, // 30% discount for pooling
        originalFare: ride.fare,
      });
    }

    return poolable;
  },
});

/** Join a pooled ride — auth required */
export const joinPooledRide = mutation({
  args: {
    rideId: v.id("rides"),
    riderId: v.id("riders"),
    pickupLatitude: v.number(),
    pickupLongitude: v.number(),
    pickupAddress: v.string(),
    dropoffLatitude: v.number(),
    dropoffLongitude: v.number(),
    dropoffAddress: v.string(),
    fare: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const ride = await ctx.db.get(args.rideId);
    if (!ride) throw new Error("Ride not found");
    if (!ride.isPooling) throw new Error("This ride does not support pooling");
    if (ride.status === "completed" || ride.status === "cancelled") {
      throw new Error("Cannot join a completed or cancelled ride");
    }

    // Check not already in pool
    const existing = await ctx.db
      .query("poolRiders")
      .withIndex("by_rideId", (q) => q.eq("rideId", args.rideId))
      .filter((q) => q.eq(q.field("riderId"), args.riderId))
      .first();
    if (existing) throw new Error("Already in this pool");

    // Check capacity
    const vehicle = await ctx.db.get(ride.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");
    const poolRiders = await ctx.db
      .query("poolRiders")
      .withIndex("by_rideId", (q) => q.eq("rideId", args.rideId))
      .collect();
    if (poolRiders.length + 1 >= vehicle.capacity) {
      throw new Error("Ride is full");
    }

    // Apply pool discount (30% off)
    const discountedFare = Math.round(args.fare * 0.7);

    return await ctx.db.insert("poolRiders", {
      rideId: args.rideId,
      riderId: args.riderId,
      pickupLatitude: args.pickupLatitude,
      pickupLongitude: args.pickupLongitude,
      pickupAddress: args.pickupAddress,
      dropoffLatitude: args.dropoffLatitude,
      dropoffLongitude: args.dropoffLongitude,
      dropoffAddress: args.dropoffAddress,
      fare: discountedFare,
      joinedAt: Date.now(),
    });
  },
});

/** Get all riders in a pooled ride */
export const getPoolRiders = query({
  args: { rideId: v.id("rides") },
  handler: async (ctx, { rideId }) => {
    const poolEntries = await ctx.db
      .query("poolRiders")
      .withIndex("by_rideId", (q) => q.eq("rideId", rideId))
      .collect();

    const results = [];
    for (const entry of poolEntries) {
      const rider = await ctx.db.get(entry.riderId);
      results.push({
        ...entry,
        riderName: rider?.name ?? "Unknown",
        riderPhone: rider?.phone,
      });
    }

    // Also include the original rider from the ride
    const ride = await ctx.db.get(rideId);
    let originalRiderInfo = null;
    if (ride) {
      const originalRider = await ctx.db.get(ride.riderId);
      originalRiderInfo = {
        riderId: ride.riderId,
        riderName: originalRider?.name ?? "Unknown",
        riderPhone: originalRider?.phone,
        pickupAddress: ride.pickupAddress,
        dropoffAddress: ride.dropoffAddress,
        fare: ride.fare,
        isOriginal: true,
      };
    }

    return { originalRider: originalRiderInfo, poolRiders: results };
  },
});
