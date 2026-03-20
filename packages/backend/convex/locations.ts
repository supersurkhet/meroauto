import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  getAuthenticatedUser,
  requireRole,
  getDriverProfile,
  haversineDistance,
} from "./lib/helpers";

/** Driver updates their real-time location */
export const updateDriverLocation = mutation({
  args: {
    lat: v.float64(),
    lng: v.float64(),
    heading: v.optional(v.float64()),
    speed: v.optional(v.float64()),
  },
  handler: async (ctx, { lat, lng, heading, speed }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);

    const existing = await ctx.db
      .query("driverLocations")
      .withIndex("by_driverId", (q) => q.eq("driverId", driver._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lat,
        lng,
        heading,
        speed,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("driverLocations", {
      driverId: driver._id,
      lat,
      lng,
      heading,
      speed,
      updatedAt: Date.now(),
    });
  },
});

/** Get driver's current location (for rider tracking) */
export const getDriverLocation = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("driverLocations")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .unique();
  },
});

/** Get all nearby available drivers (for map display) */
export const nearbyDrivers = query({
  args: {
    lat: v.float64(),
    lng: v.float64(),
    radiusKm: v.optional(v.float64()),
  },
  handler: async (ctx, { lat, lng, radiusKm = 5 }) => {
    const allLocations = await ctx.db.query("driverLocations").collect();
    const results: Array<{
      driverId: typeof allLocations[0]["driverId"];
      lat: number;
      lng: number;
      heading: number | undefined;
      distance: number;
    }> = [];

    for (const loc of allLocations) {
      const driver = await ctx.db.get(loc.driverId);
      if (!driver || driver.status !== "available") continue;

      const dist = haversineDistance(lat, lng, loc.lat, loc.lng);
      if (dist <= radiusKm) {
        results.push({
          driverId: loc.driverId,
          lat: loc.lat,
          lng: loc.lng,
          heading: loc.heading,
          distance: dist,
        });
      }
    }

    return results.sort((a, b) => a.distance - b.distance);
  },
});

/** Track a ride's driver location in real-time (subscription-friendly) */
export const trackRideDriver = query({
  args: { rideId: v.id("rides") },
  handler: async (ctx, { rideId }) => {
    await getAuthenticatedUser(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) return null;

    const location = await ctx.db
      .query("driverLocations")
      .withIndex("by_driverId", (q) => q.eq("driverId", ride.driverId))
      .unique();

    return location;
  },
});

/** Admin: get all active driver locations for live map */
export const allActiveDriverLocations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (user.role !== "admin") throw new Error("Admin only");

    const locations = await ctx.db.query("driverLocations").collect();
    const results = [];

    for (const loc of locations) {
      const driver = await ctx.db.get(loc.driverId);
      if (driver && driver.status !== "offline") {
        const user = await ctx.db.get(driver.userId);
        results.push({
          ...loc,
          driver: {
            _id: driver._id,
            status: driver.status,
            rating: driver.rating,
          },
          driverName: user?.name,
        });
      }
    }

    return results;
  },
});

/** Append location point to ride route (breadcrumb trail) */
export const appendRoutePoint = mutation({
  args: {
    rideId: v.id("rides"),
    lat: v.float64(),
    lng: v.float64(),
  },
  handler: async (ctx, { rideId, lat, lng }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    const ride = await ctx.db.get(rideId);

    if (!ride || ride.driverId !== driver._id) throw new Error("Invalid ride");
    if (ride.status !== "in_progress") return;

    const route = ride.route ?? [];
    route.push({ lat, lng, timestamp: Date.now() });
    await ctx.db.patch(rideId, { route });
  },
});
