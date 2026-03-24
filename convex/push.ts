import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";

export const saveSubscription = mutation({
  args: {
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    deviceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if this exact device/browser is already subscribed
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // If another user logged into this browser, update the owner
      if (existing.userId !== args.userId) {
        await ctx.db.patch(existing._id, { userId: args.userId });
      }
      return existing._id;
    }

    // Save new subscription
    return await ctx.db.insert("pushSubscriptions", {
      userId: args.userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      deviceType: args.deviceType || "web",
      createdAt: Date.now(),
    });
  },
});

export const removeSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
      
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Internal mutation to clean up dead subscriptions
export const removeDeadSubscription = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});