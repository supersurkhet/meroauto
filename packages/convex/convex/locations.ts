import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

/** Driver updates their real-time location */
export const updateDriverLocation = mutation({
  args: {
    driverId: v.id("drivers"),
    latitude: v.number(),
    longitude: v.number(),
    heading: v.optional(v.number()),
    speed: v.optional(v.number()),
  },
  handler: async (ctx, { driverId, latitude, longitude, heading, speed }) => {
    const existing = await ctx.db
      .query("driverLocations")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        latitude,
        longitude,
        heading,
        speed,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("driverLocations", {
      driverId,
      latitude,
      longitude,
      heading,
      speed,
      updatedAt: Date.now(),
    });
  },
});

/** Get driver's current location */
export const getDriverLocation = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    return await ctx.db
      .query("driverLocations")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .unique();
  },
});

/** Get nearby available drivers (for rider map) */
export const getNearbyDrivers = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.optional(v.number()),
  },
  handler: async (ctx, { latitude, longitude, radiusKm }) => {
    const radius = radiusKm ?? 5;
    const allLocations = await ctx.db.query("driverLocations").collect();
    const results: Array<{
      driverId: (typeof allLocations)[0]["driverId"];
      latitude: number;
      longitude: number;
      heading: number | undefined;
      distance: number;
    }> = [];

    for (const loc of allLocations) {
      const driver = await ctx.db.get(loc.driverId);
      if (!driver || !driver.isOnline || !driver.isApproved || driver.isSuspended) continue;

      const dist = haversineDistance(latitude, longitude, loc.latitude, loc.longitude);
      if (dist <= radius) {
        results.push({
          driverId: loc.driverId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          heading: loc.heading,
          distance: Math.round(dist * 100) / 100,
        });
      }
    }

    return results.sort((a, b) => a.distance - b.distance);
  },
});

/** Get all online driver locations (for admin map) */
export const getAllDriverLocations = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("driverLocations").collect();
    const results = [];

    for (const loc of locations) {
      const driver = await ctx.db.get(loc.driverId);
      if (driver && driver.isOnline) {
        results.push({
          ...loc,
          driverName: driver.name,
          driverStatus: driver.isOnline ? "online" : "offline",
          rating: driver.rating,
        });
      }
    }

    return results;
  },
});

/** Subscribe to a single driver's location — optimized for rider live tracking */
export const subscribeDriverLocation = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    const loc = await ctx.db
      .query("driverLocations")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .unique();
    if (!loc) return null;
    return {
      latitude: loc.latitude,
      longitude: loc.longitude,
      heading: loc.heading,
      speed: loc.speed,
      updatedAt: loc.updatedAt,
    };
  },
});

/** Subscribe to all active rides with driver locations — for admin dashboard */
export const subscribeActiveRides = query({
  args: {},
  handler: async (ctx) => {
    const activeRides = await ctx.db
      .query("rides")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "driver_arriving"),
          q.eq(q.field("status"), "driver_arrived"),
          q.eq(q.field("status"), "in_progress"),
        ),
      )
      .collect();

    const enriched = [];
    for (const ride of activeRides) {
      const rider = await ctx.db.get(ride.riderId);
      const driver = await ctx.db.get(ride.driverId);
      const vehicle = await ctx.db.get(ride.vehicleId);
      const loc = await ctx.db
        .query("driverLocations")
        .withIndex("by_driverId", (q) => q.eq("driverId", ride.driverId))
        .unique();

      enriched.push({
        _id: ride._id,
        status: ride.status,
        pickup: {
          latitude: ride.pickupLatitude,
          longitude: ride.pickupLongitude,
          address: ride.pickupAddress,
        },
        dropoff: {
          latitude: ride.dropoffLatitude,
          longitude: ride.dropoffLongitude,
          address: ride.dropoffAddress,
        },
        fare: ride.fare,
        createdAt: ride.createdAt,
        startedAt: ride.startedAt,
        riderName: rider?.name ?? "Unknown",
        driverName: driver?.name ?? "Unknown",
        driverPhone: driver?.phone,
        vehicleRegistration: vehicle?.registrationNumber,
        vehicleColor: vehicle?.color,
        driverLocation: loc
          ? {
              latitude: loc.latitude,
              longitude: loc.longitude,
              heading: loc.heading,
              updatedAt: loc.updatedAt,
            }
          : null,
      });
    }

    return enriched;
  },
});

/** Remove driver location (when going offline) */
export const removeDriverLocation = mutation({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    const loc = await ctx.db
      .query("driverLocations")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .unique();
    if (loc) {
      await ctx.db.delete(loc._id);
    }
  },
});
