import { v } from "convex/values";
import { query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

//  HELPERS 
const getStartOfDay = (date: number | Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Robust JSON Extractor
const parseAIResponse = (content: string) => {
  try {
    return JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Could not parse JSON from content: ${content.substring(0, 100)}...`);
  }
};

//  1. DRIFT METRICS 
export const getDriftMetrics = query({
  args: { userId: v.optional(v.id("users")) },
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

    const todayStart = getStartOfDay(Date.now()).getTime();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userRecord._id))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    // Overdue = Strictly before today
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < todayStart
    );

    const driftMinutes = overdueTasks.reduce(
      (acc, t) => acc + (t.estimatedTime ?? 30),
      0
    );

    const isCritical = driftMinutes > 180 || overdueTasks.length > 5;

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
    };
  },
});

//  2. DETAILED CALENDAR CONTEXT 
export const getScheduleContext = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getStartOfDay(Date.now());

    // Fetch ALL active tasks (Future)
    const allTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    const calendar = [] as any[];

    // Scan next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateTs = date.getTime();

      const daysTasks = allTasks.filter(
        (t) => t.dueDate && getStartOfDay(t.dueDate).getTime() === dateTs
      );

      const load = daysTasks.reduce((acc, t) => acc + (t.estimatedTime ?? 30), 0);

      calendar.push({
        dayOffset: i, // 0 = Today, 1 = Tomorrow
        date: date.toDateString(),
        loadMinutes: load,
        // Send Task IDs so AI can "Move" them
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

//  3. ALGORITHMIC RECOVERY AGENT 
export const recoverSchedule = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const drift = await ctx.runQuery(api.agent.getDriftMetrics, {
      userId: args.userId,
    });

    if (!drift || !drift.hasDrift) {
      return { message: "Schedule is healthy.", success: true };
    }

    const context = await ctx.runQuery(api.agent.getScheduleContext, {
      userId: args.userId,
    });

    const openai = new OpenAI({
      apiKey: process.env.NVIDIA_MISTRAL_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    const prompt = `
      You are a Strict Logic Gatekeeper.
      
      OBJECTIVE: Schedule Overdue Tasks adhering to the "Full Bucket Rule".
      CONSTANTS: MAX_DAILY_MINUTES = 720.

      INPUT:
      - Overdue Tasks: ${JSON.stringify(drift.overdueTasks)}
      - Calendar: ${JSON.stringify(context.calendar)}

      ALGORITHM (Apply strictly for EACH Overdue Task):

      Step 1: Check Day 0 Capacity
         - Calculate Projected Load: (Calendar[0].loadMinutes + OverdueTask.estimatedTime).
         - IF Projected Load <= 720:
             -> **ACTION:** Schedule OverdueTask to Day 0.
             -> Update Calendar[0].loadMinutes.
             -> STOP.
         - IF Projected Load > 720:
             -> The Bucket is FULL. Proceed to Step 2.

      Step 2: The "Full Bucket" Entry Rule
         - **RULE:** You can enter a FULL bucket IF AND ONLY IF it contains a task with the SAME goalId.
         - Scan Calendar[0].tasks for a match where (Task.goalId === OverdueTask.goalId).
         - IF MATCH FOUND:
             -> **ACTION (SWAP):** 1. Put OverdueTask on Day 0.
                 2. Move the Matched Existing Task to the Next Available Unfilled Bucket (Day 1+).
             -> Output updates for BOTH tasks.
             -> STOP.
         - IF NO MATCH FOUND:
             -> **Access Denied.** Proceed to Step 3.

      Step 3: Find Next Unfilled Bucket
         - Scan Day 1, Day 2, etc.
         - Find the FIRST day where (CurrentLoad + OverdueTask.estimatedTime) <= 720.
         - **ACTION:** Schedule OverdueTask to that day.

      OUTPUT FORMAT:
      Return a JSON Array of ALL updates (including swaps).
      [ { "taskId": "...", "newDateOffset": number } ]
    `;

    const completion = await openai.chat.completions.create({
      model: "mistralai/devstral-2-123b-instruct-2512",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 3000,
    });

    const content = completion.choices[0].message.content || "";
    console.log("AI Output:", content);

    let plan;
    try {
      plan = parseAIResponse(content);
    } catch (e) {
      console.error("Parse Error. Content:", content);
      return {
        success: false,
        message: "The AI agent couldn't perfectly format the recovery schedule. Please try again.",
      };
    }

    const today = getStartOfDay(Date.now());
    const updates = plan.map((item: any) => {
      const date = new Date(today);
      date.setDate(date.getDate() + item.newDateOffset);
      date.setHours(9, 0, 0, 0);
      return {
        taskId: item.taskId,
        newDate: date.getTime(),
      };
    });

    await ctx.runMutation(internal.agent.saveRecoveryPlan, { updates });

    return {
      success: true,
      message: `Re-optimized schedule. ${updates.length} tasks updated.`,
      plan: updates
    };
  },
});