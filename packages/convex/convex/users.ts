import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateNonEmpty, validatePhone } from "./lib/validators";
import { requireAuth, requireAdmin } from "./lib/auth";

// ── Rider CRUD ──────────────────────────────────────────────────────

export const createRider = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    preferredLanguage: v.optional(v.union(v.literal("en"), v.literal("ne"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    validateNonEmpty(args.name, "name");
    validatePhone(args.phone);

    const existing = await ctx.db
      .query("riders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("riders", {
      userId,
      name: args.name,
      phone: args.phone,
      email: args.email,
      preferredLanguage: args.preferredLanguage ?? "en",
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const rider = await ctx.db
      .query("riders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (rider) return { ...rider, role: "rider" as const };
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (driver) return { ...driver, role: "driver" as const };
    return null;
  },
});

export const getRider = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("riders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const getRiderById = query({
  args: { riderId: v.id("riders") },
  handler: async (ctx, { riderId }) => {
    await requireAuth(ctx);
    return await ctx.db.get(riderId);
  },
});

export const updateRider = mutation({
  args: {
    riderId: v.id("riders"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    preferredLanguage: v.optional(v.union(v.literal("en"), v.literal("ne"))),
  },
  handler: async (ctx, { riderId, ...updates }) => {
    const userId = await requireAuth(ctx);
    const rider = await ctx.db.get(riderId);
    if (!rider || rider.userId !== userId) throw new Error("Not authorized");
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(riderId, filtered);
    }
    return riderId;
  },
});

// ── Driver CRUD ─────────────────────────────────────────────────────

export const createDriver = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    licenseNumber: v.string(),
    licenseExpiry: v.number(),
    preferredLanguage: v.optional(v.union(v.literal("en"), v.literal("ne"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    validateNonEmpty(args.name, "name");
    validatePhone(args.phone);
    validateNonEmpty(args.licenseNumber, "licenseNumber");
    if (args.licenseExpiry < Date.now()) {
      throw new Error("License has expired");
    }

    const existing = await ctx.db
      .query("drivers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("drivers", {
      userId,
      name: args.name,
      phone: args.phone,
      email: args.email,
      licenseNumber: args.licenseNumber,
      licenseExpiry: args.licenseExpiry,
      isOnline: false,
      isApproved: false,
      isSuspended: false,
      rating: 5.0,
      totalRides: 0,
      totalEarnings: 0,
      preferredLanguage: args.preferredLanguage ?? "en",
      createdAt: Date.now(),
    });
  },
});

export const getDriver = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("drivers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const getDriverById = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    await requireAuth(ctx);
    return await ctx.db.get(driverId);
  },
});

export const updateDriver = mutation({
  args: {
    driverId: v.id("drivers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    licenseExpiry: v.optional(v.number()),
    preferredLanguage: v.optional(v.union(v.literal("en"), v.literal("ne"))),
  },
  handler: async (ctx, { driverId, ...updates }) => {
    const userId = await requireAuth(ctx);
    const driver = await ctx.db.get(driverId);
    if (!driver || driver.userId !== userId) throw new Error("Not authorized");
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(driverId, filtered);
    }
    return driverId;
  },
});

export const updateDriverStatus = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, { isOnline }) => {
    const userId = await requireAuth(ctx);
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!driver) throw new Error("Driver not found");
    if (driver.isSuspended) throw new Error("Driver is suspended");
    if (!driver.isApproved) throw new Error("Driver not approved");
    await ctx.db.patch(driver._id, { isOnline });
    return driver._id;
  },
});
