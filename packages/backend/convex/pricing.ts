import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  getAuthenticatedUser,
  requireAdmin,
  haversineDistance,
} from "./lib/helpers";

/** Estimate fare for a ride */
export const estimateFare = query({
  args: {
    pickupLat: v.float64(),
    pickupLng: v.float64(),
    dropoffLat: v.float64(),
    dropoffLng: v.float64(),
    vehicleType: v.optional(
      v.union(v.literal("auto_rickshaw"), v.literal("e_rickshaw")),
    ),
  },
  handler: async (ctx, args) => {
    const distance = haversineDistance(
      args.pickupLat,
      args.pickupLng,
      args.dropoffLat,
      args.dropoffLng,
    );

    const vehicleType = args.vehicleType ?? "auto_rickshaw";

    // Try to find zone-specific pricing based on pickup location
    const zones = await ctx.db
      .query("zones")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    let matchedZone = null;
    for (const zone of zones) {
      const distToCenter = haversineDistance(
        args.pickupLat,
        args.pickupLng,
        zone.center.lat,
        zone.center.lng,
      );
      if (distToCenter <= zone.radiusKm) {
        matchedZone = zone;
        break;
      }
    }

    // Find applicable pricing rule
    let pricing = null;
    if (matchedZone) {
      pricing = await ctx.db
        .query("pricing")
        .withIndex("by_zone", (q) => q.eq("zoneId", matchedZone!._id))
        .filter((q) => q.eq(q.field("vehicleType"), vehicleType))
        .first();
    }

    // Fall back to default pricing
    if (!pricing) {
      pricing = await ctx.db
        .query("pricing")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .filter((q) => q.eq(q.field("vehicleType"), vehicleType))
        .first();
    }

    // Hardcoded fallback if no pricing rules exist
    const baseFare = pricing?.baseFare ?? 50;
    const perKmRate = pricing?.perKmRate ?? 25;
    const minimumFare = pricing?.minimumFare ?? 50;
    const surgeMultiplier = pricing?.surgeMultiplier ?? 1.0;

    const estimatedDuration = (distance / 20) * 60; // ~20km/h average, in minutes
    const perMinuteRate = pricing?.perMinuteRate ?? 2;

    let fare =
      (baseFare + distance * perKmRate + estimatedDuration * perMinuteRate) *
      surgeMultiplier;
    fare = Math.max(fare, minimumFare);
    fare = Math.round(fare);

    return {
      fare,
      distance: Math.round(distance * 100) / 100,
      estimatedDuration: Math.round(estimatedDuration),
      surgeMultiplier,
      zone: matchedZone?.name ?? null,
      breakdown: {
        baseFare,
        distanceCharge: Math.round(distance * perKmRate),
        timeCharge: Math.round(estimatedDuration * perMinuteRate),
        surgeCharge: surgeMultiplier > 1 ? Math.round(fare * (1 - 1 / surgeMultiplier)) : 0,
      },
    };
  },
});

// ── Admin pricing management ────────────────────────────────────────

export const createPricingRule = mutation({
  args: {
    zoneId: v.optional(v.id("zones")),
    vehicleType: v.union(v.literal("auto_rickshaw"), v.literal("e_rickshaw")),
    baseFare: v.float64(),
    perKmRate: v.float64(),
    perMinuteRate: v.float64(),
    minimumFare: v.float64(),
    surgeMultiplier: v.optional(v.float64()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("pricing", {
      ...args,
      surgeMultiplier: args.surgeMultiplier ?? 1.0,
      isDefault: args.isDefault ?? false,
      effectiveFrom: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const updatePricingRule = mutation({
  args: {
    pricingId: v.id("pricing"),
    baseFare: v.optional(v.float64()),
    perKmRate: v.optional(v.float64()),
    perMinuteRate: v.optional(v.float64()),
    minimumFare: v.optional(v.float64()),
    surgeMultiplier: v.optional(v.float64()),
  },
  handler: async (ctx, { pricingId, ...updates }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(pricingId, updates);
    return pricingId;
  },
});

export const listPricingRules = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rules = await ctx.db.query("pricing").collect();
    const results = [];
    for (const rule of rules) {
      const zone = rule.zoneId ? await ctx.db.get(rule.zoneId) : null;
      results.push({ ...rule, zoneName: zone?.name ?? "Default" });
    }
    return results;
  },
});

export const setSurgeMultiplier = mutation({
  args: {
    zoneId: v.optional(v.id("zones")),
    multiplier: v.float64(),
  },
  handler: async (ctx, { zoneId, multiplier }) => {
    await requireAdmin(ctx);
    if (multiplier < 1 || multiplier > 5) throw new Error("Surge must be 1-5x");

    const rules = zoneId
      ? await ctx.db.query("pricing").withIndex("by_zone", (q) => q.eq("zoneId", zoneId)).collect()
      : await ctx.db.query("pricing").withIndex("by_default", (q) => q.eq("isDefault", true)).collect();

    for (const rule of rules) {
      await ctx.db.patch(rule._id, { surgeMultiplier: multiplier });
    }
  },
});
