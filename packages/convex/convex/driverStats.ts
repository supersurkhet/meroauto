import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

/** Get driver stats — today's rides, earnings, rating, etc. */
export const getDriverStats = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    await requireAuth(ctx);
    const driver = await ctx.db.get(driverId);
    if (!driver) throw new Error("Driver not found");

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const allRides = await ctx.db
      .query("rides")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .collect();

    const todayRides = allRides.filter((r) => r.createdAt >= todayMs);
    const todayCompleted = todayRides.filter((r) => r.status === "completed");
    const todayEarnings = todayCompleted.reduce((sum, r) => sum + r.fare, 0);

    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    const qrCode = await ctx.db
      .query("autoQrCodes")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return {
      driver: {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        rating: driver.rating,
        isOnline: driver.isOnline,
        isApproved: driver.isApproved,
        totalRides: driver.totalRides,
        totalEarnings: driver.totalEarnings,
      },
      today: {
        rides: todayCompleted.length,
        earnings: todayEarnings,
        activeRides: todayRides.filter((r) =>
          ["driver_arriving", "driver_arrived", "in_progress"].includes(r.status),
        ).length,
        cancelled: todayRides.filter((r) => r.status === "cancelled").length,
      },
      vehicle: vehicle
        ? {
            _id: vehicle._id,
            registrationNumber: vehicle.registrationNumber,
            model: vehicle.model,
            color: vehicle.color,
          }
        : null,
      qrCode: qrCode?.qrCode ?? null,
    };
  },
});

/** Get driver earnings for a period */
export const getDriverEarnings = query({
  args: {
    driverId: v.id("drivers"),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
  },
  handler: async (ctx, { driverId, period }) => {
    await requireAuth(ctx);
    const driver = await ctx.db.get(driverId);
    if (!driver) throw new Error("Driver not found");

    const now = Date.now();
    const periodMs = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    }[period];
    const cutoff = now - periodMs;

    const rides = await ctx.db
      .query("rides")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const periodRides = rides.filter((r) => r.completedAt && r.completedAt >= cutoff);
    const totalEarnings = periodRides.reduce((sum, r) => sum + r.fare, 0);
    const avgPerRide = periodRides.length > 0 ? totalEarnings / periodRides.length : 0;

    // Group by day for chart data
    const dailyBreakdown: Record<string, { rides: number; earnings: number }> = {};
    for (const ride of periodRides) {
      const date = new Date(ride.completedAt!).toISOString().split("T")[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = { rides: 0, earnings: 0 };
      }
      dailyBreakdown[date].rides++;
      dailyBreakdown[date].earnings += ride.fare;
    }

    // Payment method breakdown
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_driverId", (q) => q.eq("driverId", driverId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();
    const periodPayments = payments.filter((p) => p.createdAt >= cutoff);
    const byMethod: Record<string, number> = {};
    for (const p of periodPayments) {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
    }

    return {
      period,
      totalRides: periodRides.length,
      totalEarnings: Math.round(totalEarnings),
      avgPerRide: Math.round(avgPerRide),
      currency: "NPR",
      dailyBreakdown: Object.entries(dailyBreakdown)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      byPaymentMethod: byMethod,
    };
  },
});
