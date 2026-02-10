import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    targetDate: v.optional(v.number()),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("goals", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      category: args.category,
      targetDate: args.targetDate,
      progress: 0,
      status: "active",
      color: args.color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const createGoalWithTasks = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    color: v.string(),
    targetDate: v.number(),
    tasks: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        estimatedTime: v.number(),
        dueDateOffset: v.number(), // We receive offset (e.g., day 1, day 5)
      })
    ),
  },
  handler: async (ctx, args) => {
    const { tasks, ...goalData } = args;

    // 1. Create the Goal
    const goalId = await ctx.db.insert("goals", {
      ...goalData,
      status: "active",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      targetDate: goalData.targetDate,
    });

    // 2. Create the Tasks
    const now = Date.now();
    const dayInMillis = 24 * 60 * 60 * 1000;

    for (const task of tasks) {
      await ctx.db.insert("tasks", {
        userId: args.userId,
        goalId: goalId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedTime: task.estimatedTime,
        dueDate: now + (task.dueDateOffset * dayInMillis), // Calculate actual date
        completed: false,
        createdAt: now,
      });
    }

    return goalId;
  },
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("goals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    targetDate: v.optional(v.number()),
    progress: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    return await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    // Delete all tasks associated with this goal
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete all notes associated with this goal
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();

    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    // Delete the goal
    await ctx.db.delete(args.id);
  },
});

export const updateProgress = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();

    if (tasks.length === 0) {
      await ctx.db.patch(args.id, { progress: 0, updatedAt: Date.now() });
      return 0;
    }

    const completedTasks = tasks.filter((task) => task.completed).length;
    const progress = Math.round((completedTasks / tasks.length) * 100);

    await ctx.db.patch(args.id, {
      progress,
      updatedAt: Date.now()
    });

    return progress;
  },
});