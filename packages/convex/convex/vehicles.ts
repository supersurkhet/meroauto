import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateNonEmpty, validateCapacity } from "./lib/validators";
import { requireAuth, requireDriver, requireAdmin } from "./lib/auth";

export const registerVehicle = mutation({
  args: {
    driverId: v.id("drivers"),
    registrationNumber: v.string(),
    model: v.string(),
    color: v.string(),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireDriver(ctx);
    validateNonEmpty(args.registrationNumber, "registrationNumber");
    validateNonEmpty(args.model, "model");
    validateNonEmpty(args.color, "color");
    if (args.capacity !== undefined) validateCapacity(args.capacity);

    // Verify driver exists
    const driver = await ctx.db.get(args.driverId);
    if (!driver) throw new Error("Driver not found");
    // Check for duplicate registration
    const existing = await ctx.db
      .query("vehicles")
      .withIndex("by_registrationNumber", (q) =>
        q.eq("registrationNumber", args.registrationNumber),
      )
      .unique();
    if (existing) throw new Error("Vehicle already registered");

    return await ctx.db.insert("vehicles", {
      driverId: args.driverId,
      registrationNumber: args.registrationNumber,
      model: args.model,
      color: args.color,
      capacity: args.capacity ?? 3,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const updateVehicle = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    model: v.optional(v.string()),
    color: v.optional(v.string()),
    capacity: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { vehicleId, ...updates }) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(vehicleId, filtered);
    }
    return vehicleId;
  },
});

export const getVehiclesByDriver = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    return await ctx.db
      .query("vehicles")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .collect();
  },
});

export const getActiveVehicle = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    return await ctx.db
      .query("vehicles")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

export const getAllVehicles = query({
  args: {},
  handler: async (ctx) => {
    const vehicles = await ctx.db.query("vehicles").collect();
    const results = [];
    for (const v of vehicles) {
      const driver = await ctx.db.get(v.driverId);
      results.push({ ...v, driverName: driver?.name });
    }
    return results;
  },
});
