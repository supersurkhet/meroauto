import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  getAuthenticatedUser,
  requireRole,
  requireAdmin,
  getRiderProfile,
  getDriverProfile,
} from "./lib/helpers";

/** Record a payment for a ride */
export const recordPayment = mutation({
  args: {
    rideId: v.id("rides"),
    amount: v.float64(),
    method: v.union(
      v.literal("cash"),
      v.literal("khalti"),
      v.literal("esewa"),
      v.literal("fonepay"),
    ),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, { rideId, amount, method, transactionId }) => {
    const user = await getAuthenticatedUser(ctx);
    const ride = await ctx.db.get(rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.status !== "completed" && ride.status !== "rated") {
      throw new Error("Can only pay for completed rides");
    }

    // Check for existing payment
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_rideId", (q) => q.eq("rideId", rideId))
      .first();
    if (existing && existing.status === "completed") {
      throw new Error("Ride already paid");
    }

    const status = method === "cash" ? "completed" : "pending";

    const paymentId = await ctx.db.insert("payments", {
      rideId,
      riderId: ride.riderId,
      driverId: ride.driverId,
      amount,
      method,
      status,
      transactionId,
      paidAt: status === "completed" ? Date.now() : undefined,
      createdAt: Date.now(),
    });

    return paymentId;
  },
});

/** Verify/complete a digital payment (webhook callback) */
export const verifyPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    providerRef: v.string(),
    success: v.boolean(),
  },
  handler: async (ctx, { paymentId, providerRef, success }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "pending") throw new Error("Payment not pending");

    await ctx.db.patch(paymentId, {
      status: success ? "completed" : "failed",
      providerRef,
      paidAt: success ? Date.now() : undefined,
    });

    return paymentId;
  },
});

/** Refund a payment (admin) */
export const refundPayment = mutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, { paymentId }) => {
    await requireAdmin(ctx);
    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "completed") throw new Error("Can only refund completed payments");

    await ctx.db.patch(paymentId, { status: "refunded" });
    return paymentId;
  },
});

/** Get payment for a ride */
export const getByRideId = query({
  args: { rideId: v.id("rides") },
  handler: async (ctx, { rideId }) => {
    await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("payments")
      .withIndex("by_rideId", (q) => q.eq("rideId", rideId))
      .first();
  },
});

/** Rider's payment history */
export const myPayments = query({
  args: { limit: v.optional(v.float64()) },
  handler: async (ctx, { limit = 20 }) => {
    const user = await requireRole(ctx, "rider");
    const rider = await getRiderProfile(ctx, user._id);
    return await ctx.db
      .query("payments")
      .withIndex("by_riderId", (q) => q.eq("riderId", rider._id))
      .order("desc")
      .take(limit);
  },
});

/** Driver's received payments */
export const driverPayments = query({
  args: { limit: v.optional(v.float64()) },
  handler: async (ctx, { limit = 20 }) => {
    const user = await requireRole(ctx, "driver");
    const driver = await getDriverProfile(ctx, user._id);
    return await ctx.db
      .query("payments")
      .withIndex("by_driverId", (q) => q.eq("driverId", driver._id))
      .order("desc")
      .take(limit);
  },
});

/** Admin: list all payments */
export const listAll = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("refunded"),
      ),
    ),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, { status, limit = 50 }) => {
    await requireAdmin(ctx);
    if (status) {
      return await ctx.db
        .query("payments")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("payments").order("desc").take(limit);
  },
});
