import { query, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";

// Helper to get YYYY-MM-DD string for UTC today
function getTodayString() {
  const date = new Date();
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export const getUsage = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayString();
    const record = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", today))
      .first();
    
    return record?.count || 0;
  },
});

export const increment = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayString();
    const record = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId).eq("date", today))
      .first();

    if (record) {
      if (record.count >= 8) {
        throw new ConvexError("RATE_LIMIT_EXCEEDED"); 
      }
      await ctx.db.patch(record._id, { count: record.count + 1 });
      return record.count + 1;
    } else {
      await ctx.db.insert("aiUsage", { userId: args.userId, date: today, count: 1 });
      return 1;
    }
  },
});