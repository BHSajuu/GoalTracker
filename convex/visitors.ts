import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Track a visitor (Idempotent: won't duplicate if IP exists)
export const trackVisitor = mutation({
  args: {
    ip: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("visitors")
      .withIndex("by_ip", (q) => q.eq("ip", args.ip))
      .first();

    if (existing) {
      // Update last visit time
      await ctx.db.patch(existing._id, { lastVisit: Date.now() });
    } else {
      // Insert new visitor
      await ctx.db.insert("visitors", {
        ip: args.ip,
        city: args.city,
        country: args.country,
        firstSeen: Date.now(),
        lastVisit: Date.now(),
      });
    }
  },
});

// 2. Get the total count
export const getVisitorCount = query({
  args: {},
  handler: async (ctx) => {
    const visitors = await ctx.db.query("visitors").collect();
    return visitors.length;
  },
});