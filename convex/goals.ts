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
        dueDateOffset: v.number(), 
      })
    ),
  },
  handler: async (ctx, args) => {
    const { tasks, ...goalData } = args;

    // Create the Goal
    const goalId = await ctx.db.insert("goals", {
      ...goalData,
      status: "active",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      targetDate: goalData.targetDate,
    });

    // Create the Tasks
    const now = Date.now();
    const dayInMillis = 24 * 60 * 60 * 1000;

    for (const task of tasks) {
      let calculatedDueDate = now + (task.dueDateOffset * dayInMillis);
      
      // Cap the task due date so it doesn't exceed the goal's target date
      if (calculatedDueDate > goalData.targetDate) {
        calculatedDueDate = goalData.targetDate;
      }

      await ctx.db.insert("tasks", {
        userId: args.userId,
        goalId: goalId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedTime: task.estimatedTime,
        dueDate: calculatedDueDate,
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
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    targetDate: v.optional(v.number()),
    progress: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;
    
    // Fetch and verify ownership
    const goal = await ctx.db.get(id);
    if (!goal) throw new Error("Goal not found");
    if (goal.userId !== userId) throw new Error("Unauthorized to update this goal");

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
  args: { 
    id: v.id("goals"),
    userId: v.id("users") 
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) throw new Error("Goal not found");
    if (goal.userId !== args.userId) throw new Error("Unauthorized to delete this goal");

    // Clean up Tasks and their associated Focus Sessions
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();

    for (const task of tasks) {
      // Find and delete all focus sessions for this task
      const focusSessions = await ctx.db
        .query("focusSessions")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      
      for (const session of focusSessions) {
        await ctx.db.delete(session._id);
      }
      
      // Delete the task itself
      await ctx.db.delete(task._id);
    }

    //  Clean up Notes and their associated Storage Files
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();

    for (const note of notes) {
      // If it has storage IDs, delete the files from storage
      if (note.images) {
        for (const storageId of note.images) {
          // Only attempt to delete if it looks like a Convex ID (not an external URL)
          if (!storageId.startsWith("http")) {
            try {
              await ctx.storage.delete(storageId);
            } catch (e) {
              console.error("Failed to delete storage file:", storageId, e);
              // We do NOT throw here so that the DB deletion can still proceed
            }
          }
        }
      }
      // Delete the note itself
      await ctx.db.delete(note._id);
    }

    // Clean up Note Files (Folders) associated with this goal
    const noteFiles = await ctx.db
      .query("noteFiles")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();
      
    for (const file of noteFiles) {
      await ctx.db.delete(file._id);
    }

    // Finally, delete the goal
    await ctx.db.delete(args.id);
  },
});

export const updateProgress = mutation({
  args: { 
    id: v.id("goals"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) throw new Error("Goal not found");
    if (goal.userId !== args.userId) throw new Error("Unauthorized to update progress");

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();

    // Filter out archived tasks - they shouldn't count towards the goal progress
    const activeTasks = tasks.filter((task) => !task.isArchived);

    if (activeTasks.length === 0) {
      await ctx.db.patch(args.id, { progress: 0, updatedAt: Date.now() });
      return 0;
    }

    const completedTasks = activeTasks.filter((task) => task.completed).length;
    const progress = Math.round((completedTasks / activeTasks.length) * 100);

    await ctx.db.patch(args.id, {
      progress,
      updatedAt: Date.now()
    });

    return progress;
  },
});