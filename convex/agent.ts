import { v } from "convex/values";
import { query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";

// TIMEZONE-AWARE HELPER
const getLocalMidnight = (dateTs: number, offsetMinutes: number) => {
  const localTimeMs = dateTs - (offsetMinutes * 60000);
  const d = new Date(localTimeMs);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime() + (offsetMinutes * 60000);
};

// Robust 3-Stage JSON Extractor
const parseAIResponse = (content: string) => {
  try {
    return JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (err) {
        console.warn("Failed to parse JSON from markdown block", err);
      }
    }

    try {
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      const firstBracket = content.indexOf('[');
      const lastBracket = content.lastIndexOf(']');

      let startIndex = -1;
      let endIndex = -1;

      if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        startIndex = firstBracket;
        endIndex = lastBracket + 1;
      } else if (firstBrace !== -1) {
        startIndex = firstBrace;
        endIndex = lastBrace + 1;
      }

      if (startIndex !== -1 && endIndex !== -1) {
        const extracted = content.substring(startIndex, endIndex);
        return JSON.parse(extracted);
      }
    } catch (err) {
      console.warn("Failed to parse JSON via bracket extraction", err);
    }

    throw new Error(`Could not parse JSON from content: ${content.substring(0, 100)}...`);
  }
};

// 1. DRIFT METRICS (Upgraded to capture the whole Goal context)
export const getDriftMetrics = query({
  args: {
    userId: v.optional(v.id("users")),
    timezoneOffset: v.number(),
  },
  handler: async (ctx, args) => {
    let userRecord;
    if (args.userId) {
      userRecord = await ctx.db.get(args.userId);
    } else {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
      userRecord = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .unique();
    }
    if (!userRecord) return null;

    const todayStart = getLocalMidnight(Date.now(), args.timezoneOffset);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userRecord._id))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < todayStart
    );

    const driftMinutes = overdueTasks.reduce(
      (acc, t) => acc + (t.estimatedTime ?? 30),
      0
    );

    const isCritical = driftMinutes > 180 || overdueTasks.length > 5;

    // Identify goals that are affected by drift, and fetch ALL their pending tasks to cascade them
    const affectedGoalIds = new Set(overdueTasks.map((t) => t.goalId));
    const allAffectedTasks = tasks.filter((t) => affectedGoalIds.has(t.goalId)).map(t => ({
      _id: t._id,
      title: t.title,
      goalId: t.goalId,
      priority: t.priority,
      estimatedTime: t.estimatedTime ?? 30,
      dueDate: t.dueDate,
    }));

    return {
      hasDrift: overdueTasks.length > 0,
      driftMinutes,
      overdueCount: overdueTasks.length,
      isCritical,
      overdueTasks: overdueTasks.map((t) => ({
        _id: t._id,
        title: t.title,
        goalId: t.goalId,
        priority: t.priority,
        estimatedTime: t.estimatedTime ?? 30,
      })),
      allAffectedTasks, // New metric passed to agent
    };
  },
});

// 2. DETAILED CALENDAR CONTEXT 
export const getScheduleContext = query({
  args: {
    userId: v.id("users"),
    timezoneOffset: v.number(),
  },
  handler: async (ctx, args) => {
    const today = getLocalMidnight(Date.now(), args.timezoneOffset);

    const allTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    const calendar = [] as any[];

    for (let i = 0; i < 7; i++) {
      const dayBoundary = today + (i * 24 * 60 * 60 * 1000);

      const localTimeMsForDay = dayBoundary - (args.timezoneOffset * 60000);
      const dateObj = new Date(localTimeMsForDay);
      const isWeekend = dateObj.getUTCDay() === 0 || dateObj.getUTCDay() === 6;

      const daysTasks = allTasks.filter((t) => {
        if (!t.dueDate) return false;
        const taskMidnight = getLocalMidnight(t.dueDate, args.timezoneOffset);
        return taskMidnight === dayBoundary;
      });

      const load = daysTasks.reduce((acc, t) => acc + (t.estimatedTime ?? 30), 0);
      const dailyMaxMinutes = isWeekend ? 360 : 720;

      calendar.push({
        dayOffset: i,
        date: dateObj.toDateString(),
        isWeekend,
        maxCapacity: dailyMaxMinutes,
        loadMinutes: load,
        // Ensure we pass the tasks array so the Agent can dynamically clear it
        tasks: daysTasks.map(t => ({
          taskId: t._id,
          goalId: t.goalId,
          estimatedTime: t.estimatedTime ?? 30,
        }))
      });
    }

    return { calendar };
  },
});

export const saveRecoveryPlan = internalMutation({
  args: {
    updates: v.array(
      v.object({
        taskId: v.id("tasks"),
        newDate: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.taskId, { dueDate: update.newDate });
    }
  },
});

// 3. HYBRID CASCADING AGENT
export const recoverSchedule = action({
  args: {
    userId: v.id("users"),
    timezoneOffset: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.runMutation(internal.rateLimit.increment, { userId: args.userId });
    } catch (error: any) {
      if (error.message.includes("RATE_LIMIT_EXCEEDED")) {
        throw new Error("Daily AI limit reached (8/8). Please try again tomorrow!");
      }
      throw error;
    }

    const drift = await ctx.runQuery(api.agent.getDriftMetrics, {
      userId: args.userId,
      timezoneOffset: args.timezoneOffset,
    });

    if (!drift || !drift.hasDrift) {
      return { message: "Schedule is healthy.", success: true };
    }

    const context = await ctx.runQuery(api.agent.getScheduleContext, {
      userId: args.userId,
      timezoneOffset: args.timezoneOffset,
    });

    const openai = new OpenAI({
      apiKey: process.env.NVIDIA_MISTRAL_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    const prompt = `
      You are an expert productivity coach. 
      I have a list of overdue tasks that need to be rescheduled.

      INPUT TASKS:
      ${JSON.stringify(drift.overdueTasks)}

      YOUR OBJECTIVE:
      Determine the absolute best execution order for these tasks.
      
      RULES:
      1. High priority tasks MUST come before Medium/Low priority tasks.
      2. Group tasks with the exact same 'goalId' consecutively to prevent the user from context-switching too much.
      3. Do NO math and do NO scheduling. Just determine the order.

      OUTPUT FORMAT:
      Return ONLY a raw JSON array of strings, where each string is the '_id' of the task in the sorted order.
      Example: ["id_1", "id_2", "id_3"]
      
      CRITICAL: Output absolutely nothing else. No markdown, no explanations. Just the JSON array.
    `;

    const completion = await openai.chat.completions.create({
      model: "mistralai/devstral-2-123b-instruct-2512",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content || "";

    let sortedTaskIds: Id<"tasks">[];
    try {
      sortedTaskIds = parseAIResponse(content);
      if (!Array.isArray(sortedTaskIds)) throw new Error("AI did not return an array");
    } catch (e) {
      console.error("Parse Error. Content:", content);
      return {
        success: false,
        message: "The AI agent couldn't perfectly sort the tasks. Please try again.",
      };
    }

    const today = getLocalMidnight(Date.now(), args.timezoneOffset);
    const updates: { taskId: Id<"tasks">; newDate: number }[] = [];

    // Determine which Goals are affected by overdue tasks
    const affectedGoalIds = new Set(drift.allAffectedTasks.map((t: any) => t.goalId));

    // Clear the calendar loads for affected goals to prevent double-counting as we repack them
    const calendarCopy = context.calendar.map((day: any) => {
      const unaffectedTasks = day.tasks.filter((t: any) => !affectedGoalIds.has(t.goalId));
      const newLoad = unaffectedTasks.reduce((acc: number, t: any) => acc + t.estimatedTime, 0);
      return {
        ...day,
        loadMinutes: newLoad
      };
    });

    const processedGoalIds = new Set<string>();
    const validSortedIds = sortedTaskIds.filter(id => drift.overdueTasks.some((t: any) => t._id === id));
    const forgottenTasks = drift.overdueTasks.filter((t: any) => !validSortedIds.includes(t._id)).map((t: any) => t._id);
    const finalExecutionOrder = [...validSortedIds, ...forgottenTasks];

    // CASCADING REPACK LOGIC
    for (const taskId of finalExecutionOrder) {
      const task = drift.overdueTasks.find((t: any) => t._id === taskId);
      if (!task) continue;

      const goalId = task.goalId;
      if (processedGoalIds.has(goalId)) continue;
      processedGoalIds.add(goalId);

      // Get ALL tasks for this Goal (overdue + future) and sort chronologically
      const goalTasks = drift.allAffectedTasks
        .filter((t: any) => t.goalId === goalId)
        .sort((a: any, b: any) => {
          const dateA = a.dueDate ?? Infinity;
          const dateB = b.dueDate ?? Infinity;
          return dateA - dateB;
        });

      // Track sequential flow. The next task in the goal CANNOT be scheduled before this index.
      let searchStartDayIndex = 0;

      for (const gTask of goalTasks) {
        const timeNeeded = gTask.estimatedTime ?? 30;
        let placed = false;

        for (let i = searchStartDayIndex; i < calendarCopy.length; i++) {
          const day = calendarCopy[i];

          if (day.loadMinutes + timeNeeded <= day.maxCapacity) {
            day.loadMinutes += timeNeeded;

            const targetMidnight = today + (day.dayOffset * 24 * 60 * 60 * 1000);
            const scheduledDate = targetMidnight + 32400000; // 9 AM

            updates.push({
              taskId: gTask._id,
              newDate: scheduledDate,
            });

            placed = true;
            searchStartDayIndex = i; // Enforce dependency (A2 can't happen before A1)
            break;
          }
        }

        if (!placed) {
          // Fallback if absolutely no room
          const fallbackMidnight = today + (6 * 24 * 60 * 60 * 1000);
          updates.push({
            taskId: gTask._id,
            newDate: fallbackMidnight + 32400000,
          });
          searchStartDayIndex = 6;
        }
      }
    }

    if (updates.length > 0) {
      await ctx.runMutation(internal.agent.saveRecoveryPlan, { updates });
    }

    return {
      success: true,
      message: `Re-optimized schedule. ${updates.length} tasks intelligently rebalanced.`,
      plan: updates
    };
  },
});