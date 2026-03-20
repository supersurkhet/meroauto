import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/** Save or update a push notification token for a user */
export const savePushToken = mutation({
  args: {
    userId: v.string(),
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
  },
  handler: async (ctx, { userId, token, platform }) => {
    // Check if this token already exists
    const existingToken = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (existingToken) {
      // Update existing token (might have changed user)
      await ctx.db.patch(existingToken._id, {
        userId,
        platform,
        updatedAt: Date.now(),
      });
      return existingToken._id;
    }

    // Create new token
    const now = Date.now();
    return await ctx.db.insert("pushTokens", {
      userId,
      token,
      platform,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Get all push tokens for a user */
export const getPushTokens = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("pushTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Remove a push token (on logout) */
export const removePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/** Remove all tokens for a user (on account deletion) */
export const removeAllUserTokens = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const tokens = await ctx.db
      .query("pushTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const t of tokens) {
      await ctx.db.delete(t._id);
    }
  },
});
