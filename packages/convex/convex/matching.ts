import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const SEARCH_RADII = [2, 5, 10]; // km
const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * matchDriver — scheduled internal mutation
 * Finds nearest online, approved driver within expanding radius.
 * Radius steps: 2km → 5km → 10km.
 * If no driver found at max radius, retries after 5s.
 * If request expired, marks it as expired.
 */
export const matchDriver = internalMutation({
  args: {
    requestId: v.id("rideRequests"),
    radiusIndex: v.number(),
  },
  handler: async (ctx, { requestId, radiusIndex }) => {
    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "pending") return;

    // Check expiry
    if (Date.now() > request.expiresAt) {
      await ctx.db.patch(requestId, { status: "expired" });
      return;
    }

    const radius = SEARCH_RADII[radiusIndex] ?? SEARCH_RADII[SEARCH_RADII.length - 1];

    // Get all driver locations
    const allLocations = await ctx.db.query("driverLocations").collect();

    // Today's start for load balancing
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    type Candidate = {
      driverId: (typeof allLocations)[0]["driverId"];
      distance: number;
      todayRides: number;
    };
    const candidates: Candidate[] = [];

    for (const loc of allLocations) {
      const driver = await ctx.db.get(loc.driverId);
      if (!driver) continue;
      if (!driver.isOnline || !driver.isApproved || driver.isSuspended) continue;

      // Check driver doesn't already have an active ride
      const activeRide = await ctx.db
        .query("rides")
        .withIndex("by_driverId", (q) => q.eq("driverId", loc.driverId))
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "driver_arriving"),
            q.eq(q.field("status"), "driver_arrived"),
            q.eq(q.field("status"), "in_progress"),
          ),
        )
        .first();
      if (activeRide) continue;

      // Check driver isn't already matched to another request
      const otherMatch = await ctx.db
        .query("rideRequests")
        .withIndex("by_matchedDriverId", (q) => q.eq("matchedDriverId", loc.driverId))
        .filter((q) => q.eq(q.field("status"), "matched"))
        .first();
      if (otherMatch) continue;

      const dist = haversineDistance(
        request.pickupLatitude,
        request.pickupLongitude,
        loc.latitude,
        loc.longitude,
      );

      if (dist <= radius) {
        // Count today's completed rides for load balancing
        const todayRides = await ctx.db
          .query("rides")
          .withIndex("by_driverId", (q) => q.eq("driverId", loc.driverId))
          .filter((q) =>
            q.and(
              q.eq(q.field("status"), "completed"),
              q.gte(q.field("createdAt"), todayMs),
            ),
          )
          .collect();

        candidates.push({
          driverId: loc.driverId,
          distance: dist,
          todayRides: todayRides.length,
        });
      }
    }

    // Sort by: fewer rides today first, then by distance (load balancing)
    candidates.sort((a, b) => {
      if (a.todayRides !== b.todayRides) return a.todayRides - b.todayRides;
      return a.distance - b.distance;
    });

    const bestDriver = candidates[0] ?? null;

    if (bestDriver) {
      // Found a driver — match them
      await ctx.db.patch(requestId, {
        status: "matched",
        matchedDriverId: bestDriver.driverId,
        searchRadius: radius,
      });
    } else if (radiusIndex + 1 < SEARCH_RADII.length) {
      // Expand radius, retry in 3s
      await ctx.db.patch(requestId, {
        searchRadius: SEARCH_RADII[radiusIndex + 1],
      });
      await ctx.scheduler.runAfter(3000, internal.matching.matchDriver, {
        requestId,
        radiusIndex: radiusIndex + 1,
      });
    } else {
      // Max radius reached, retry in 5s
      await ctx.scheduler.runAfter(5000, internal.matching.matchDriver, {
        requestId,
        radiusIndex: SEARCH_RADII.length - 1,
      });
    }
  },
});
