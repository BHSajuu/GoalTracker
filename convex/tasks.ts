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
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");
    if (goal.userId !== args.userId) throw new Error("Unauthorized to add tasks to this goal");

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
  args: { 
    goalId: v.id("goals"),
    userId: v.id("users") 
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== args.userId) return [];

    return await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();
  },
});

export const getTodayTasks = query({
  args: {
    userId: v.id("users"),
    startOfDay: v.number(), 
    endOfDay: v.number(),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", args.userId)
          .gte("dueDate", args.startOfDay)
          .lt("dueDate", args.endOfDay)
      )
      .collect();

    return tasks.filter((task) => !task.isArchived);
  },
});

export const getUpcomingTasks = query({
  args: {
    userId: v.id("users"),
    days: v.number(),
    startOfDay: v.number() 
  },
  handler: async (ctx, args) => {
    const endDate = new Date(args.startOfDay);
    endDate.setDate(endDate.getDate() + args.days);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", args.userId)
          .gte("dueDate", args.startOfDay)
          .lt("dueDate", endDate.getTime())
      )
      .collect();

    return tasks.filter((task) => !task.isArchived);
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.number()),
    estimatedTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;

    // Fetch the task first to check its existing completedAt status
    const task = await ctx.db.get(id);
    if (!task) throw new Error("Task not found");
    if (task.userId !== userId) throw new Error("Unauthorized");
 
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ) as Partial<typeof updates> & { completedAt?: number };

    // Only set a new completedAt if it doesn't already have one.
    if (updates.completed === true && !task.completedAt) {
      filteredUpdates.completedAt = Date.now();
    }

    return await ctx.db.patch(id, filteredUpdates);
  },
});

export const toggleComplete = mutation({
  args: { 
    id: v.id("tasks"),
    userId: v.id("users") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    if (task.userId !== args.userId) throw new Error("Unauthorized");

    const newCompleted = !task.completed;

    const patchData: { completed: boolean; completedAt?: number } = {
      completed: newCompleted,
    };

    // Only assign a new timestamp if it's the FIRST time being completed.
    // If they are re-checking an accidentally unchecked task, it keeps its original date!
    if (newCompleted && !task.completedAt) {
      patchData.completedAt = Date.now();
    }

    // 1. Update the task
    await ctx.db.patch(args.id, patchData);

    // 2. Update Goal Progress immediately
    const allGoalTasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goalId", task.goalId))
      .collect();

     const activeTasks = allGoalTasks.filter((t) => !t.isArchived);
    
    // Replace the old state of the toggled task with its new state for calculation
    const updatedTasks = activeTasks.map((t) =>
      t._id === args.id ? { ...t, completed: newCompleted } : t
    );


    if (updatedTasks.length > 0) {
      const completedCount = updatedTasks.filter((t) => t.completed).length;
      const progress = Math.round((completedCount / updatedTasks.length) * 100);

      await ctx.db.patch(task.goalId, {
        progress,
        updatedAt: Date.now(),
      });
    }

    return newCompleted;
  },
});

// Soft Delete (Archive)
export const archive = mutation({
  args: { 
    id: v.id("tasks"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    if (task.userId !== args.userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { isArchived: true });

    // Recalculate goal progress since an archived task no longer counts
    const allGoalTasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goalId", task.goalId))
      .collect();

    const activeTasks = allGoalTasks.filter((t) => !t.isArchived && t._id !== args.id);

    const progress = activeTasks.length > 0 
      ? Math.round((activeTasks.filter(t => t.completed).length / activeTasks.length) * 100)
      : 0;

    await ctx.db.patch(task.goalId, { progress, updatedAt: Date.now() });
  },
});

// Hard Delete (Permanent)
export const remove = mutation({
  args: { 
    id: v.id("tasks"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    if (task.userId !== args.userId) throw new Error("Unauthorized");

    // Clean up focus sessions
    const focusSessions = await ctx.db
      .query("focusSessions")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();
    
    for (const session of focusSessions) {
      await ctx.db.delete(session._id);
    }

    const goalId = task.goalId;
    await ctx.db.delete(args.id);

    // Recalculate goal progress
    const allGoalTasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goalId", goalId))
      .collect();

    const activeTasks = allGoalTasks.filter((t) => !t.isArchived);

    const progress = activeTasks.length > 0 
      ? Math.round((activeTasks.filter(t => t.completed).length / activeTasks.length) * 100)
      : 0;

    await ctx.db.patch(goalId, { progress, updatedAt: Date.now() });
  },
});

// Save a focus session and update the total actual time for the task
export const saveFocusSession = mutation({
  args: {
    userId: v.id("users"),
    taskId: v.id("tasks"),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    status: v.union(v.literal("completed"), v.literal("interrupted")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== args.userId) throw new Error("Unauthorized");

    await ctx.db.insert("focusSessions", {
      userId: args.userId,
      taskId: args.taskId,
      startTime: args.startTime,
      endTime: args.endTime,
      duration: args.duration,
      status: args.status,
    });

    const currentActual = task.actualTime || 0;
    await ctx.db.patch(args.taskId, {
      actualTime: currentActual + args.duration,
    });
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
  args: {
    userId: v.id("users"),
    localTodayStart: v.number() 
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const todayTime = args.localTodayStart;
    const weekAgoTime = todayTime - (7 * 24 * 60 * 60 * 1000);

    const completedTasksWithDates = tasks
      .filter((t) => t.completed && t.completedAt)
      .map((t) => new Date(t.completedAt!).setHours(0, 0, 0, 0))
      .sort((a, b) => b - a);

    const uniqueDays = Array.from(new Set(completedTasksWithDates));

    let currentStreak = 0;
    const yesterdayTime = todayTime - (24 * 60 * 60 * 1000);

    const hasCompletedToday = uniqueDays.includes(todayTime);
    const hasCompletedYesterday = uniqueDays.includes(yesterdayTime);

    if (hasCompletedToday || hasCompletedYesterday) {
      let checkDate = hasCompletedToday ? todayTime : yesterdayTime;
      for (const day of uniqueDays) {
        if (day === checkDate) {
          currentStreak++;
          checkDate -= (24 * 60 * 60 * 1000);
        }
      }
    }

    const completedThisWeek = tasks.filter(
      (task) =>
        task.completed &&
        task.completedAt &&
        task.completedAt >= weekAgoTime
    ).length;

    const totalCompleted = tasks.filter((task) => task.completed).length;
    const totalPending = tasks.filter((task) => !task.completed && !task.isArchived).length;

    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const dateStart = todayTime - (i * 24 * 60 * 60 * 1000);
      const nextDate = dateStart + (24 * 60 * 60 * 1000);

      const completedOnDay = tasks.filter(
        (task) =>
          task.completed &&
          task.completedAt &&
          task.completedAt >= dateStart &&
          task.completedAt < nextDate
      ).length;

      dailyData.push({
        date: new Date(dateStart).toLocaleDateString("en-US", { weekday: "short" }),
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