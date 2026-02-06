import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Helper to parse "2h", "30m" into minutes
function parseDuration(timeStr?: string): number {
  if (!timeStr) return 30; // Default assumption if no time set
  const str = timeStr.toLowerCase().trim();
  
  // Extract number
  const match = str.match(/^(\d+(\.\d+)?)/);
  if (!match) return 30;
  
  const value = parseFloat(match[1]);
  if (str.includes("h")) return Math.round(value * 60);
  if (str.includes("m")) return Math.round(value);
  return 30; // Fallback
}

export const getSuggestion = query({
  args: { 
    userId: v.id("users"),
    availableMinutes: v.number(),
    todayStart: v.number(), // Client sends their local "start of day" timestamp
  },
  handler: async (ctx, args) => {
    // 1. Get all incomplete tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    // 2. Filter: Only look at Overdue tasks or tasks Due Today
    const endOfToday = args.todayStart + (24 * 60 * 60 * 1000);
    
    const relevantTasks = tasks.filter(t => {
      // Include if it has a due date AND it's before or during today
      return t.dueDate && t.dueDate < endOfToday;
    });

    // 3. Sort Logic: High Priority > Oldest Due Date
    const priorityScore = { high: 3, medium: 2, low: 1 };
    
    const sorted = relevantTasks.sort((a, b) => {
      const pDiff = priorityScore[b.priority] - priorityScore[a.priority];
      if (pDiff !== 0) return pDiff;
      const dateA = a.dueDate || 0;
      const dateB = b.dueDate || 0;
      return dateA - dateB;
    });

    // 4. Bucket into "Fit" vs "Overflow"
    let currentMinutes = 0;
    const planned: Doc<"tasks">[] = [];
    const overflow: Doc<"tasks">[] = [];

    for (const task of sorted) {
      const duration = parseDuration(task.estimatedTime);
      
      if (currentMinutes + duration <= args.availableMinutes) {
        planned.push(task);
        currentMinutes += duration;
      } else {
        overflow.push(task);
      }
    }

    return {
      planned,
      overflow,
      stats: {
        totalTasks: relevantTasks.length,
        totalMinutes: currentMinutes + overflow.reduce((sum, t) => sum + parseDuration(t.estimatedTime), 0),
        plannedMinutes: currentMinutes,
        overflowMinutes: overflow.reduce((sum, t) => sum + parseDuration(t.estimatedTime), 0)
      }
    };
  }
});

// NEW: Commit the plan (updates both Today and Tomorrow lists)
export const commitPlan = mutation({
  args: {
    todayIds: v.array(v.id("tasks")),
    tomorrowIds: v.array(v.id("tasks")),
    todayDate: v.number(),    // Timestamp for today
    tomorrowDate: v.number(), // Timestamp for tomorrow
  },
  handler: async (ctx, args) => {
    // 1. Update tasks to stay on "Today"
    for (const id of args.todayIds) {
      await ctx.db.patch(id, { dueDate: args.todayDate });
    }

    // 2. Move overflow tasks to "Tomorrow"
    for (const id of args.tomorrowIds) {
      await ctx.db.patch(id, { dueDate: args.tomorrowDate });
    }
  }
});

// Deprecated (keeping for safety, but commitPlan replaces this)
export const moveTasks = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
    targetDate: v.number(),
  },
  handler: async (ctx, args) => {
    for (const id of args.taskIds) {
      await ctx.db.patch(id, { dueDate: args.targetDate });
    }
  }
});