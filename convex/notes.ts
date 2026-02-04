import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    goalId: v.id("goals"),
    // ADDED: "link" type support
    type: v.union(v.literal("text"), v.literal("image"), v.literal("link")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notes", {
      userId: args.userId,
      goalId: args.goalId,
      type: args.type,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const getByGoal = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .order("desc")
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});