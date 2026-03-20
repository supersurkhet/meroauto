import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedUser, requireAdmin } from "./lib/helpers";

export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthenticatedUser(ctx);
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await getAuthenticatedUser(ctx);
    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    preferredLanguage: v.optional(v.union(v.literal("en"), v.literal("ne"))),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await ctx.db.patch(user._id, args);
    return user._id;
  },
});

export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("rider"), v.literal("driver"), v.literal("admin")),
  },
  handler: async (ctx, { userId, role }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(userId, { role });
    return userId;
  },
});

export const listByRole = query({
  args: { role: v.union(v.literal("rider"), v.literal("driver"), v.literal("admin")) },
  handler: async (ctx, { role }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", role))
      .collect();
  },
});
