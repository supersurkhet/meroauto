import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin, haversineDistance } from "./lib/helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("zones")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const getById = query({
  args: { zoneId: v.id("zones") },
  handler: async (ctx, { zoneId }) => {
    return await ctx.db.get(zoneId);
  },
});

/** Find zone for a given location */
export const findByLocation = query({
  args: { lat: v.float64(), lng: v.float64() },
  handler: async (ctx, { lat, lng }) => {
    const zones = await ctx.db
      .query("zones")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    for (const zone of zones) {
      const dist = haversineDistance(lat, lng, zone.center.lat, zone.center.lng);
      if (dist <= zone.radiusKm) return zone;
    }
    return null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    nameNe: v.optional(v.string()),
    centerLat: v.float64(),
    centerLng: v.float64(),
    radiusKm: v.float64(),
    boundary: v.optional(v.array(v.object({ lat: v.float64(), lng: v.float64() }))),
    baseFare: v.float64(),
    perKmRate: v.float64(),
    minimumFare: v.float64(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("zones", {
      name: args.name,
      nameNe: args.nameNe,
      center: { lat: args.centerLat, lng: args.centerLng },
      radiusKm: args.radiusKm,
      boundary: args.boundary,
      isActive: true,
      baseFare: args.baseFare,
      perKmRate: args.perKmRate,
      minimumFare: args.minimumFare,
      surgeMultiplier: 1.0,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    zoneId: v.id("zones"),
    name: v.optional(v.string()),
    nameNe: v.optional(v.string()),
    radiusKm: v.optional(v.float64()),
    baseFare: v.optional(v.float64()),
    perKmRate: v.optional(v.float64()),
    minimumFare: v.optional(v.float64()),
    surgeMultiplier: v.optional(v.float64()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { zoneId, ...updates }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(zoneId, updates);
    return zoneId;
  },
});

export const remove = mutation({
  args: { zoneId: v.id("zones") },
  handler: async (ctx, { zoneId }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(zoneId, { isActive: false });
    return zoneId;
  },
});

/** Admin: list all zones including inactive */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("zones").collect();
  },
});
