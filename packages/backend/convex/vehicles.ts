import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  requireRole,
  requireAdmin,
  getDriverProfile,
} from "./lib/helpers";

export const register = mutation({
  args: {
    type: v.union(v.literal("auto_rickshaw"), v.literal("e_rickshaw")),
    registrationNumber: v.string(),
    color: v.optional(v.string()),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.float64()),
    seatCapacity: v.optional(v.float64()),
    insuranceExpiry: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);

    const vehicleId = await ctx.db.insert("vehicles", {
      driverId: driver._id,
      type: args.type,
      registrationNumber: args.registrationNumber,
      color: args.color,
      make: args.make,
      model: args.model,
      year: args.year,
      seatCapacity: args.seatCapacity ?? 3,
      isActive: true,
      insuranceExpiry: args.insuranceExpiry,
      createdAt: Date.now(),
    });

    // Set as current vehicle if none set
    if (!driver.currentVehicleId) {
      await ctx.db.patch(driver._id, { currentVehicleId: vehicleId });
    }

    return vehicleId;
  },
});

export const setActive = mutation({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, { vehicleId }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    const vehicle = await ctx.db.get(vehicleId);
    if (!vehicle || vehicle.driverId !== driver._id) {
      throw new Error("Vehicle not found");
    }
    await ctx.db.patch(driver._id, { currentVehicleId: vehicleId });
    return vehicleId;
  },
});

export const update = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    color: v.optional(v.string()),
    insuranceExpiry: v.optional(v.float64()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { vehicleId, ...updates }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    const vehicle = await ctx.db.get(vehicleId);
    if (!vehicle || vehicle.driverId !== driver._id) {
      throw new Error("Vehicle not found");
    }
    await ctx.db.patch(vehicleId, updates);
    return vehicleId;
  },
});

export const myVehicles = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    return await ctx.db
      .query("vehicles")
      .withIndex("by_driverId", (q) => q.eq("driverId", driver._id))
      .collect();
  },
});

export const getById = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, { vehicleId }) => {
    return await ctx.db.get(vehicleId);
  },
});

/** Admin: list all vehicles */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const vehicles = await ctx.db.query("vehicles").collect();
    const results = [];
    for (const v of vehicles) {
      const driver = await ctx.db.get(v.driverId);
      const user = driver ? await ctx.db.get(driver.userId) : null;
      results.push({ ...v, driverName: user?.name });
    }
    return results;
  },
});
