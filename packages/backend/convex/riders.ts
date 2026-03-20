import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  getAuthenticatedUser,
  requireRole,
  getRiderProfile,
} from "./lib/helpers";

export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireRole(ctx, "rider");
    return await getRiderProfile(ctx, user._id);
  },
});

export const register = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    await ctx.db.patch(user._id, { role: "rider" });

    const existing = await ctx.db
      .query("riders")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) throw new Error("Rider profile already exists");

    return await ctx.db.insert("riders", {
      userId: user._id,
      rating: 5.0,
      totalRides: 0,
      createdAt: Date.now(),
    });
  },
});

export const addSavedLocation = mutation({
  args: {
    label: v.string(),
    lat: v.float64(),
    lng: v.float64(),
    address: v.string(),
  },
  handler: async (ctx, { label, lat, lng, address }) => {
    const user = await requireRole(ctx, "rider");
    const rider = await getRiderProfile(ctx, user._id);
    const saved = rider.savedLocations ?? [];
    saved.push({ label, lat, lng, address });
    await ctx.db.patch(rider._id, { savedLocations: saved });
    return rider._id;
  },
});

export const removeSavedLocation = mutation({
  args: { label: v.string() },
  handler: async (ctx, { label }) => {
    const user = await requireRole(ctx, "rider");
    const rider = await getRiderProfile(ctx, user._id);
    const saved = (rider.savedLocations ?? []).filter((l) => l.label !== label);
    await ctx.db.patch(rider._id, { savedLocations: saved });
    return rider._id;
  },
});

export const setPreferredPayment = mutation({
  args: {
    method: v.union(
      v.literal("cash"),
      v.literal("khalti"),
      v.literal("esewa"),
      v.literal("fonepay"),
    ),
  },
  handler: async (ctx, { method }) => {
    const user = await requireRole(ctx, "rider");
    const rider = await getRiderProfile(ctx, user._id);
    await ctx.db.patch(rider._id, { preferredPaymentMethod: method });
    return rider._id;
  },
});
