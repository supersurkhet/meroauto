import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

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

export const createZone = mutation({
  args: {
    name: v.string(),
    nameNe: v.string(),
    centerLatitude: v.number(),
    centerLongitude: v.number(),
    radiusKm: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("zones", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const updateZone = mutation({
  args: {
    zoneId: v.id("zones"),
    name: v.optional(v.string()),
    nameNe: v.optional(v.string()),
    centerLatitude: v.optional(v.number()),
    centerLongitude: v.optional(v.number()),
    radiusKm: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { zoneId, ...updates }) => {
    await requireAdmin(ctx);
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(zoneId, filtered);
    }
    return zoneId;
  },
});

export const getActiveZones = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("zones")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getZoneForLocation = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, { latitude, longitude }) => {
    const zones = await ctx.db
      .query("zones")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const zone of zones) {
      const dist = haversineDistance(
        latitude,
        longitude,
        zone.centerLatitude,
        zone.centerLongitude,
      );
      if (dist <= zone.radiusKm) return zone;
    }
    return null;
  },
});

export const getAllZones = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("zones").collect();
  },
});
