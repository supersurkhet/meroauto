import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  getAuthenticatedUser,
  requireRole,
  requireAdmin,
  getDriverProfile,
} from "./lib/helpers";

export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireRole(ctx, "driver");
    return await getDriverProfile(ctx, user._id);
  },
});

export const getById = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    await getAuthenticatedUser(ctx);
    const driver = await ctx.db.get(driverId);
    if (!driver) throw new Error("Driver not found");
    const user = await ctx.db.get(driver.userId);
    const vehicle = driver.currentVehicleId
      ? await ctx.db.get(driver.currentVehicleId)
      : null;
    return { ...driver, user, vehicle };
  },
});

export const register = mutation({
  args: {
    licenseNumber: v.string(),
    licenseExpiry: v.float64(),
  },
  handler: async (ctx, { licenseNumber, licenseExpiry }) => {
    const user = await getAuthenticatedUser(ctx);
    // Set user role to driver
    await ctx.db.patch(user._id, { role: "driver" });

    const existing = await ctx.db
      .query("drivers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) throw new Error("Driver profile already exists");

    return await ctx.db.insert("drivers", {
      userId: user._id,
      licenseNumber,
      licenseExpiry,
      status: "offline",
      isApproved: false,
      isSuspended: false,
      rating: 5.0,
      totalRides: 0,
      totalEarnings: 0,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    status: v.union(
      v.literal("offline"),
      v.literal("available"),
      v.literal("busy"),
      v.literal("on_ride"),
    ),
  },
  handler: async (ctx, { status }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    if (driver.isSuspended) throw new Error("Driver is suspended");
    if (!driver.isApproved) throw new Error("Driver not yet approved");
    await ctx.db.patch(driver._id, { status });
    return driver._id;
  },
});

export const approve = mutation({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(driverId, { isApproved: true });
    return driverId;
  },
});

export const suspend = mutation({
  args: { driverId: v.id("drivers"), suspended: v.boolean() },
  handler: async (ctx, { driverId, suspended }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(driverId, {
      isSuspended: suspended,
      status: suspended ? "offline" : "available",
    });
    return driverId;
  },
});

export const listAll = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("offline"),
        v.literal("available"),
        v.literal("busy"),
        v.literal("on_ride"),
      ),
    ),
  },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    if (status) {
      return await ctx.db
        .query("drivers")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    }
    return await ctx.db.query("drivers").collect();
  },
});

export const listPendingApproval = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("drivers")
      .withIndex("by_approved", (q) => q.eq("isApproved", false))
      .collect();
  },
});

export const getEarnings = query({
  args: {
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
  },
  handler: async (ctx, { period }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    const now = Date.now();
    const periodMs = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    }[period];
    const cutoff = now - periodMs;

    const rides = await ctx.db
      .query("rides")
      .withIndex("by_driverId_status", (q) =>
        q.eq("driverId", driver._id).eq("status", "completed"),
      )
      .collect();

    const periodRides = rides.filter(
      (r) => r.completedAt && r.completedAt >= cutoff,
    );

    return {
      totalRides: periodRides.length,
      totalEarnings: periodRides.reduce(
        (sum, r) => sum + (r.finalFare ?? r.fare),
        0,
      ),
      rides: periodRides,
    };
  },
});
