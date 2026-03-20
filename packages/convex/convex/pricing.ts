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

// Default pricing fallback (NPR)
const DEFAULT_PRICING = {
  baseFare: 50,
  perKmRate: 25,
  perMinuteRate: 3,
  minimumFare: 50,
  surgePriceMultiplier: 1.0,
};

/** Get active pricing for a zone (or default) */
export const getActivePricing = query({
  args: { zoneId: v.optional(v.id("zones")) },
  handler: async (ctx, { zoneId }) => {
    if (zoneId) {
      const zonePricing = await ctx.db
        .query("pricing")
        .withIndex("by_zoneId", (q) => q.eq("zoneId", zoneId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
      if (zonePricing) return zonePricing;
    }
    // Fallback to default pricing (no zone)
    const defaultPricing = await ctx.db
      .query("pricing")
      .filter((q) =>
        q.and(
          q.eq(q.field("zoneId"), undefined),
          q.eq(q.field("isActive"), true),
        ),
      )
      .first();
    return defaultPricing;
  },
});

/** Estimate fare for a ride */
export const estimateFare = query({
  args: {
    pickupLatitude: v.number(),
    pickupLongitude: v.number(),
    dropoffLatitude: v.number(),
    dropoffLongitude: v.number(),
  },
  handler: async (ctx, args) => {
    const distance = haversineDistance(
      args.pickupLatitude,
      args.pickupLongitude,
      args.dropoffLatitude,
      args.dropoffLongitude,
    );

    // Find zone for pickup location
    const zones = await ctx.db
      .query("zones")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    let matchedZone = null;
    for (const zone of zones) {
      const distToCenter = haversineDistance(
        args.pickupLatitude,
        args.pickupLongitude,
        zone.centerLatitude,
        zone.centerLongitude,
      );
      if (distToCenter <= zone.radiusKm) {
        matchedZone = zone;
        break;
      }
    }

    // Get pricing
    let pricing = null;
    if (matchedZone) {
      pricing = await ctx.db
        .query("pricing")
        .withIndex("by_zoneId", (q) => q.eq("zoneId", matchedZone!._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
    }
    if (!pricing) {
      pricing = await ctx.db
        .query("pricing")
        .filter((q) =>
          q.and(
            q.eq(q.field("zoneId"), undefined),
            q.eq(q.field("isActive"), true),
          ),
        )
        .first();
    }

    const baseFare = pricing?.baseFare ?? DEFAULT_PRICING.baseFare;
    const perKmRate = pricing?.perKmRate ?? DEFAULT_PRICING.perKmRate;
    const perMinuteRate = pricing?.perMinuteRate ?? DEFAULT_PRICING.perMinuteRate;
    const minimumFare = pricing?.minimumFare ?? DEFAULT_PRICING.minimumFare;
    const surgeMultiplier = pricing?.surgePriceMultiplier ?? DEFAULT_PRICING.surgePriceMultiplier;

    const estimatedDuration = Math.round((distance / 20) * 60); // ~20km/h
    const distanceFare = Math.round(distance * perKmRate);
    const timeFare = Math.round(estimatedDuration * perMinuteRate);

    let totalFare = Math.round((baseFare + distanceFare + timeFare) * surgeMultiplier);
    totalFare = Math.max(totalFare, minimumFare);

    return {
      baseFare,
      distanceFare,
      timeFare,
      surgeMultiplier,
      totalFare,
      distance: Math.round(distance * 100) / 100,
      estimatedDuration,
      currency: "NPR" as const,
      zone: matchedZone?.name ?? null,
    };
  },
});

/** Admin: update pricing rule */
export const updatePricing = mutation({
  args: {
    pricingId: v.id("pricing"),
    baseFare: v.optional(v.number()),
    perKmRate: v.optional(v.number()),
    perMinuteRate: v.optional(v.number()),
    minimumFare: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { pricingId, ...updates }) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );
    await ctx.db.patch(pricingId, { ...filtered, updatedAt: Date.now() });
    return pricingId;
  },
});

/** Admin: create pricing rule */
export const createPricing = mutation({
  args: {
    zoneId: v.optional(v.id("zones")),
    baseFare: v.number(),
    perKmRate: v.number(),
    perMinuteRate: v.number(),
    minimumFare: v.number(),
    surgePriceMultiplier: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("pricing", {
      zoneId: args.zoneId,
      baseFare: args.baseFare,
      perKmRate: args.perKmRate,
      perMinuteRate: args.perMinuteRate,
      minimumFare: args.minimumFare,
      surgePriceMultiplier: args.surgePriceMultiplier ?? 1.0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Admin: set surge multiplier for a zone or globally */
export const setSurgeMultiplier = mutation({
  args: {
    zoneId: v.optional(v.id("zones")),
    multiplier: v.number(),
  },
  handler: async (ctx, { zoneId, multiplier }) => {
    if (multiplier < 1 || multiplier > 5) throw new Error("Surge must be 1x-5x");

    const pricingRules = zoneId
      ? await ctx.db
          .query("pricing")
          .withIndex("by_zoneId", (q) => q.eq("zoneId", zoneId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect()
      : await ctx.db
          .query("pricing")
          .filter((q) =>
            q.and(
              q.eq(q.field("zoneId"), undefined),
              q.eq(q.field("isActive"), true),
            ),
          )
          .collect();

    for (const rule of pricingRules) {
      await ctx.db.patch(rule._id, {
        surgePriceMultiplier: multiplier,
        updatedAt: Date.now(),
      });
    }
  },
});
