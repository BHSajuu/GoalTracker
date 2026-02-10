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
    estimatedTime: v.optional(v.number()),
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
      actualTime: 0,
      isArchived: false,
      createdAt: Date.now(),
    });
  },
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    // Only show non-archived tasks on the main list
    return tasks.filter((t) => !t.isArchived);
  },
});

export const getByGoal = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    // Show ALL tasks (active + archived) for the Goal History view
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
      if (task.isArchived) return false;
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
      if (task.isArchived) return false;
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
    estimatedTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates: any = Object.fromEntries(
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

// Soft Delete (Archive)
export const archive = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isArchived: true });
  },
});

// Hard Delete (Permanent)
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Save a focus session and update the total actual time for the task
export const saveFocusSession = mutation({
  args: {
    userId: v.id("users"),
    taskId: v.id("tasks"),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(), // In minutes
    status: v.union(v.literal("completed"), v.literal("interrupted")),
  },
  handler: async (ctx, args) => {
    // Log the individual session
    await ctx.db.insert("focusSessions", {
      userId: args.userId,
      taskId: args.taskId,
      startTime: args.startTime,
      endTime: args.endTime,
      duration: args.duration,
      status: args.status,
    });

    //  Aggregate this time into the task's 'actualTime'
    const task = await ctx.db.get(args.taskId);
    if (task) {
      const currentActual = task.actualTime || 0;
      await ctx.db.patch(args.taskId, {
        actualTime: currentActual + args.duration,
      });
    }
  },
});

// Query for the Efficiency Line Chart
export const getEfficiencyStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter for completed tasks that have both estimated and actual time recorded
    const completedTasks = tasks.filter(
      (t) => 
        t.completed && 
        t.completedAt &&
        t.estimatedTime !== undefined && 
        t.estimatedTime > 0 &&
        t.actualTime !== undefined
    );

    // Sort by completion date (oldest to newest) to show progression over time
    const sortedTasks = completedTasks.sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

    // Format for Recharts
    return sortedTasks.map((t) => ({
      name: t.title, // X-Axis Label
      estimated: t.estimatedTime,
      actual: t.actualTime,
      completedAt: t.completedAt,
    }));
  },
});

export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Stats include archived tasks to preserve history

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Streak Calculation Start
    const completedTasksWithDates = tasks
      .filter((t) => t.completed && t.completedAt)
      .map((t) => new Date(t.completedAt!).setHours(0, 0, 0, 0))
      .sort((a, b) => b - a); // Descending

    const uniqueDays = Array.from(new Set(completedTasksWithDates));

    let currentStreak = 0;
    const todayTime = today.getTime();
    const yesterdayTime = new Date(today).setDate(today.getDate() - 1);

    const hasCompletedToday = uniqueDays.includes(todayTime);
    const hasCompletedYesterday = uniqueDays.includes(yesterdayTime);

    if (hasCompletedToday || hasCompletedYesterday) {
      let checkDate = hasCompletedToday ? todayTime : yesterdayTime;
      for (const day of uniqueDays) {
        if (day === checkDate) {
          currentStreak++;
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
    // For pending, we exclude archived
    const totalPending = tasks.filter((task) => !task.completed && !task.isArchived).length;

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
      totalTasks: tasks.filter(t => !t.isArchived).length,
      totalCompleted,
      totalPending,
      completedThisWeek,
      dailyData,
      currentStreak,
      activeDays: uniqueDays,
    };
  },
});