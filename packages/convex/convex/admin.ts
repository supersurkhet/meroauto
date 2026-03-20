import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/** Admin dashboard stats */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const allRides = await ctx.db.query("rides").collect();
    const allDrivers = await ctx.db.query("drivers").collect();
    const allRiders = await ctx.db.query("riders").collect();
    const allPayments = await ctx.db.query("payments").collect();

    const todayRides = allRides.filter((r) => r.createdAt >= dayAgo);
    const weekRides = allRides.filter((r) => r.createdAt >= weekAgo);
    const activeRides = allRides.filter((r) =>
      ["driver_arriving", "driver_arrived", "in_progress"].includes(r.status),
    );
    const completedRides = allRides.filter((r) => r.status === "completed");

    const completedPayments = allPayments.filter((p) => p.status === "completed");
    const todayRevenue = completedPayments
      .filter((p) => p.createdAt >= dayAgo)
      .reduce((sum, p) => sum + p.amount, 0);
    const weekRevenue = completedPayments
      .filter((p) => p.createdAt >= weekAgo)
      .reduce((sum, p) => sum + p.amount, 0);
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      rides: {
        total: allRides.length,
        today: todayRides.length,
        thisWeek: weekRides.length,
        active: activeRides.length,
        completed: completedRides.length,
      },
      drivers: {
        total: allDrivers.length,
        online: allDrivers.filter((d) => d.isOnline).length,
        approved: allDrivers.filter((d) => d.isApproved).length,
        pending: allDrivers.filter((d) => !d.isApproved && !d.isSuspended).length,
        suspended: allDrivers.filter((d) => d.isSuspended).length,
      },
      riders: {
        total: allRiders.length,
        active: allRiders.filter((r) => r.isActive).length,
      },
      revenue: {
        today: todayRevenue,
        thisWeek: weekRevenue,
        total: totalRevenue,
        currency: "NPR",
      },
    };
  },
});

/** Revenue report for a date range */
export const getRevenueReport = query({
  args: {
    fromDate: v.number(),
    toDate: v.number(),
  },
  handler: async (ctx, { fromDate, toDate }) => {
    const payments = await ctx.db
      .query("payments")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), fromDate),
          q.lte(q.field("createdAt"), toDate),
          q.eq(q.field("status"), "completed"),
        ),
      )
      .collect();

    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
    }

    return {
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalTransactions: payments.length,
      byMethod,
      currency: "NPR",
    };
  },
});

/** List all drivers with optional filters */
export const listAllDrivers = query({
  args: {
    onlyOnline: v.optional(v.boolean()),
    onlyPending: v.optional(v.boolean()),
  },
  handler: async (ctx, { onlyOnline, onlyPending }) => {
    let drivers = await ctx.db.query("drivers").collect();

    if (onlyOnline) {
      drivers = drivers.filter((d) => d.isOnline);
    }
    if (onlyPending) {
      drivers = drivers.filter((d) => !d.isApproved && !d.isSuspended);
    }

    return drivers;
  },
});

/** Get all active rides */
export const getActiveRides = query({
  args: {},
  handler: async (ctx) => {
    const rides = await ctx.db
      .query("rides")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "driver_arriving"),
          q.eq(q.field("status"), "driver_arrived"),
          q.eq(q.field("status"), "in_progress"),
        ),
      )
      .collect();

    // Enrich with driver and rider info
    const enriched = [];
    for (const ride of rides) {
      const rider = await ctx.db.get(ride.riderId);
      const driver = await ctx.db.get(ride.driverId);
      const driverLocation = await ctx.db
        .query("driverLocations")
        .withIndex("by_driverId", (q) => q.eq("driverId", ride.driverId))
        .unique();

      enriched.push({
        ...ride,
        riderName: rider?.name,
        driverName: driver?.name,
        driverLocation: driverLocation
          ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude }
          : null,
      });
    }

    return enriched;
  },
});

/** Approve a driver */
export const approveDriver = mutation({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    const driver = await ctx.db.get(driverId);
    if (!driver) throw new Error("Driver not found");
    await ctx.db.patch(driverId, { isApproved: true, isSuspended: false });
    return driverId;
  },
});

/** Suspend a driver */
export const suspendDriver = mutation({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    const driver = await ctx.db.get(driverId);
    if (!driver) throw new Error("Driver not found");
    await ctx.db.patch(driverId, { isSuspended: true, isOnline: false });
    return driverId;
  },
});

/** Unsuspend a driver */
export const unsuspendDriver = mutation({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    const driver = await ctx.db.get(driverId);
    if (!driver) throw new Error("Driver not found");
    await ctx.db.patch(driverId, { isSuspended: false });
    return driverId;
  },
});
