import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    goalId: v.id("goals"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    estimatedTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      userId: args.userId,
      goalId: args.goalId,
      title: args.title,
      description: args.description,
      completed: false,
      priority: args.priority,
      dueDate: args.dueDate,
      estimatedTime: args.estimatedTime,
      createdAt: Date.now(),
    });
  },
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getByGoal = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();
  },
});

export const getTodayTasks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return allTasks.filter((task) => {
      if (!task.dueDate) return false;
      return task.dueDate >= today.getTime() && task.dueDate < tomorrow.getTime();
    });
  },
});

export const getUpcomingTasks = query({
  args: { userId: v.id("users"), days: v.number() },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + args.days);

    const allTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return allTasks.filter((task) => {
      if (!task.dueDate) return false;
      return task.dueDate >= today.getTime() && task.dueDate < endDate.getTime();
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.number()),
    estimatedTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (updates.completed === true) {
      filteredUpdates.completedAt = Date.now();
    }

    return await ctx.db.patch(id, filteredUpdates);
  },
});

export const toggleComplete = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return;

    const newCompleted = !task.completed;
    await ctx.db.patch(args.id, {
      completed: newCompleted,
      completedAt: newCompleted ? Date.now() : undefined,
    });

    return newCompleted;
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Streak Calculation Start
    const completedTasksWithDates = tasks
      .filter((t) => t.completed && t.completedAt)
      .map((t) => new Date(t.completedAt!).setHours(0, 0, 0, 0))
      .sort((a, b) => b - a); // Descending

    // Get unique days where at least one task was completed
    const uniqueDays = Array.from(new Set(completedTasksWithDates));

    let currentStreak = 0;
    const todayTime = today.getTime();
    const yesterdayTime = new Date(today).setDate(today.getDate() - 1);
    
    // Check if the streak is active (completed something today or yesterday)
    const hasCompletedToday = uniqueDays.includes(todayTime);
    const hasCompletedYesterday = uniqueDays.includes(yesterdayTime);
    
    if (hasCompletedToday || hasCompletedYesterday) {
        // Start counting
        // If we did something today, start from today. If not, start from yesterday.
        let checkDate = hasCompletedToday ? todayTime : yesterdayTime;
        
        for (const day of uniqueDays) {
            if (day === checkDate) {
                currentStreak++;
                // Move checkDate to previous day
                const d = new Date(checkDate);
                d.setDate(d.getDate() - 1);
                checkDate = d.getTime();
            } 
        }
    }
    // Streak Calculation End

    const completedThisWeek = tasks.filter(
      (task) =>
        task.completed &&
        task.completedAt &&
        task.completedAt >= weekAgo.getTime()
    ).length;

    const totalCompleted = tasks.filter((task) => task.completed).length;
    const totalPending = tasks.filter((task) => !task.completed).length;

    // Get daily completion data for the last 7 days
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const completedOnDay = tasks.filter(
        (task) =>
          task.completed &&
          task.completedAt &&
          task.completedAt >= date.getTime() &&
          task.completedAt < nextDate.getTime()
      ).length;

      dailyData.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        completed: completedOnDay,
      });
    }

    return {
      totalTasks: tasks.length,
      totalCompleted,
      totalPending,
      completedThisWeek,
      dailyData,
      currentStreak, 
      activeDays: uniqueDays, 
    };
  },
});