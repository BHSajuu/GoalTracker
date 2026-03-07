import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    goalId: v.id("goals"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("noteFiles", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("noteFiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const rename = mutation({
  args: {
    id: v.id("noteFiles"),
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file || file.userId !== args.userId) throw new Error("Unauthorized");
    return await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: {
    id: v.id("noteFiles"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file || file.userId !== args.userId) throw new Error("Unauthorized");
    
    // Cascade delete: Remove all notes inside this file
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const note of notes) {
      if (note.fileId === args.id) {
        await ctx.db.delete(note._id);
      }
    }
    
    await ctx.db.delete(args.id);
    return true;
  },
});