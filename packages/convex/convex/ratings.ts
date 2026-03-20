import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateRating, validateNonEmpty } from "./lib/validators";
import { requireAuth } from "./lib/auth";

export const submitRating = mutation({
  args: {
    rideId: v.id("rides"),
    fromUserId: v.string(),
    toUserId: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    validateRating(args.rating);
    validateNonEmpty(args.fromUserId, "fromUserId");
    validateNonEmpty(args.toUserId, "toUserId");
    if (args.fromUserId === args.toUserId) throw new Error("Cannot rate yourself");

    // Check ride exists and is completed
    const ride = await ctx.db.get(args.rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.status !== "completed") throw new Error("Can only rate completed rides");

    // Check for duplicate
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_rideId", (q) => q.eq("rideId", args.rideId))
      .filter((q) => q.eq(q.field("fromUserId"), args.fromUserId))
      .first();
    if (existing) throw new Error("Already rated this ride");

    const ratingId = await ctx.db.insert("ratings", {
      rideId: args.rideId,
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Update driver's average rating if rating a driver
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_userId", (q) => q.eq("userId", args.toUserId))
      .unique();

    if (driver) {
      const allRatings = await ctx.db
        .query("ratings")
        .withIndex("by_toUserId", (q) => q.eq("toUserId", args.toUserId))
        .collect();
      const avg =
        allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      await ctx.db.patch(driver._id, {
        rating: Math.round(avg * 10) / 10,
      });
    }

    return ratingId;
  },
});

export const getRatingsForUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit }) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("ratings")
      .withIndex("by_toUserId", (q) => q.eq("toUserId", userId))
      .order("desc")
      .take(limit ?? 20);
  },
});

export const getAverageRating = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireAuth(ctx);
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_toUserId", (q) => q.eq("toUserId", userId))
      .collect();

    if (ratings.length === 0) return { average: 5.0, count: 0 };

    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    return {
      average: Math.round(avg * 10) / 10,
      count: ratings.length,
    };
  },
});

export const getRatingForRide = query({
  args: { rideId: v.id("rides") },
  handler: async (ctx, { rideId }) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("ratings")
      .withIndex("by_rideId", (q) => q.eq("rideId", rideId))
      .collect();
  },
});
