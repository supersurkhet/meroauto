import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./lib/helpers";

/** Dashboard stats for admin */
export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

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
      ["matched", "accepted", "in_progress"].includes(r.status),
    );
    const completedRides = allRides.filter((r) =>
      r.status === "completed" || r.status === "rated",
    );

    const todayRevenue = allPayments
      .filter((p) => p.createdAt >= dayAgo && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    const weekRevenue = allPayments
      .filter((p) => p.createdAt >= weekAgo && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const onlineDrivers = allDrivers.filter((d) => d.status !== "offline");

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
        online: onlineDrivers.length,
        approved: allDrivers.filter((d) => d.isApproved).length,
        pendingApproval: allDrivers.filter((d) => !d.isApproved).length,
      },
      riders: {
        total: allRiders.length,
      },
      revenue: {
        today: todayRevenue,
        thisWeek: weekRevenue,
        total: allPayments
          .filter((p) => p.status === "completed")
          .reduce((sum, p) => sum + p.amount, 0),
      },
    };
  },
});

/** Ride volume by hour (for peak hours chart) */
export const ridesByHour = query({
  args: {
    days: v.optional(v.float64()),
  },
  handler: async (ctx, { days = 7 }) => {
    await requireAdmin(ctx);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const rides = await ctx.db
      .query("rides")
      .withIndex("by_createdAt")
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .collect();

    const hourCounts = new Array(24).fill(0);
    for (const ride of rides) {
      const hour = new Date(ride.createdAt).getHours();
      hourCounts[hour]++;
    }

    return hourCounts.map((count, hour) => ({ hour, count }));
  },
});

/** Driver utilization rates */
export const driverUtilization = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const drivers = await ctx.db.query("drivers").collect();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const results = [];
    for (const driver of drivers) {
      const rides = await ctx.db
        .query("rides")
        .withIndex("by_driverId", (q) => q.eq("driverId", driver._id))
        .collect();
      const todayRides = rides.filter((r) => r.createdAt >= dayAgo);
      const user = await ctx.db.get(driver.userId);

      results.push({
        driverId: driver._id,
        driverName: user?.name ?? "Unknown",
        status: driver.status,
        totalRides: driver.totalRides,
        todayRides: todayRides.length,
        rating: driver.rating,
        earnings: driver.totalEarnings,
      });
    }

    return results.sort((a, b) => b.todayRides - a.todayRides);
  },
});
