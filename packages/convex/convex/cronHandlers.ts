import { internalMutation } from "./_generated/server";

const RIDE_REQUEST_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const DRIVER_STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

/** Expire ride requests that have been pending for over 5 minutes */
export const expireStaleRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - RIDE_REQUEST_EXPIRY_MS;

    // Find all pending requests older than cutoff
    const staleRequests = await ctx.db
      .query("rideRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect();

    // Also expire matched requests that are old (driver never accepted)
    const staleMatched = await ctx.db
      .query("rideRequests")
      .withIndex("by_status", (q) => q.eq("status", "matched"))
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect();

    let expired = 0;
    for (const request of [...staleRequests, ...staleMatched]) {
      // Release matched driver if any
      if (request.matchedDriverId) {
        const driver = await ctx.db.get(request.matchedDriverId);
        if (driver && !driver.isSuspended) {
          // Driver stays online, just freed from this match
        }
      }
      await ctx.db.patch(request._id, { status: "expired" });
      expired++;
    }

    return { expired };
  },
});

/** Mark drivers as offline if they haven't updated location in 2 minutes */
export const offlineStaleDrivers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - DRIVER_STALE_THRESHOLD_MS;

    // Get all online drivers
    const onlineDrivers = await ctx.db
      .query("drivers")
      .withIndex("by_isOnline", (q) => q.eq("isOnline", true))
      .collect();

    let offlined = 0;
    for (const driver of onlineDrivers) {
      // Check their last location update
      const loc = await ctx.db
        .query("driverLocations")
        .withIndex("by_driverId", (q) => q.eq("driverId", driver._id))
        .unique();

      if (!loc || loc.updatedAt < cutoff) {
        // Check if driver has an active ride — don't offline mid-ride
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

        if (activeRide) {
          // Driver has active ride but no location — leave online but skip cleanup
          continue;
        }

        // No location or stale, no active ride — mark offline
        await ctx.db.patch(driver._id, { isOnline: false });

        // Remove stale location doc
        if (loc) {
          await ctx.db.delete(loc._id);
        }

        offlined++;
      }
    }

    return { offlined };
  },
});
