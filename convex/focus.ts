import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const logSession = mutation({
  args: {
    userId: v.id("users"),
    taskId: v.id("tasks"),
    startTime: v.number(),
    endTime: v.number(),
    status: v.union(v.literal("completed"), v.literal("interrupted")),
  },
  handler: async (ctx, args) => {
    // Calculate duration in minutes
    const durationMs = args.endTime - args.startTime;
    // Ensure at least 1 minute is recorded, otherwise standard rounding
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

    // Insert the session record into the database
    await ctx.db.insert("focusSessions", {
      userId: args.userId,
      taskId: args.taskId,
      startTime: args.startTime,
      endTime: args.endTime,
      duration: durationMinutes,
      status: args.status,
    });

    // Update the "actualTime" on the specific task
    const task = await ctx.db.get(args.taskId);
    if (task) {
      const currentActual = task.actualTime || 0;
      await ctx.db.patch(args.taskId, {
        actualTime: currentActual + durationMinutes,
      });
    }

    return durationMinutes;
  },
});

export const getTodayStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fetch all sessions for this user from today onwards
    const sessions = await ctx.db
      .query("focusSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("startTime"), today.getTime()))
      .collect();

    // Calculate totals
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    const sessionsCompleted = sessions.filter(s => s.status === "completed").length;

    return {
      totalMinutes,
      sessionsCompleted,
      sessions // Return list in case we want to show a history log later
    };
  },
});