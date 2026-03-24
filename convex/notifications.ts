/**
 * This file queries your database to figure out 
 * who needs a notification based on the preferences
 */

import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";


// 1. TASK REMINDERS (Morning)
export const getTaskReminderTargets = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const targets = [];

    // Use a sliding window: Tasks due within the next 24 hours, or already overdue
    const now = Date.now();
    const next24Hours = now + 24 * 60 * 60 * 1000;

    for (const user of allUsers) {
      if (user.preferences?.pushNotifications && user.preferences?.taskReminders) {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        // Find tasks that are pending and due before this time tomorrow
        const pendingAgenda = tasks.filter((t) =>
          !t.completed && !t.isArchived && t.dueDate && t.dueDate <= next24Hours
        );

        if (pendingAgenda.length > 0) {
          const subs = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
          if (subs.length > 0) targets.push({ pendingCount: pendingAgenda.length, subs });
        }
      }
    }
    return targets;
  },
});

export const processTaskReminders = internalAction({
  args: {},

  handler: async (ctx): Promise<{ status: string; usersFound: number; notificationsFired: number }> => {
    const targets = await ctx.runQuery(internal.notifications.getTaskReminderTargets);

    let sentCount = 0;
    for (const { pendingCount, subs } of targets) {
      for (const sub of subs) {
        await ctx.runAction(internal.pushActions.sendPush, {
          subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          title: "🎯 Daily Targets Ready",
          body: `You have ${pendingCount} task(s) on your agenda right now. Let's get to work!`,
          url: "/dashboard/tasks",
        });
        sentCount++;
      }
    }

    return {
      status: "Success",
      usersFound: targets.length,
      notificationsFired: sentCount
    };
  },
});


// 2. STREAK SAVERS (Evening)
export const getStreakSaverTargets = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const targets = [];

    // Has the user completed a task in the last 24 hours?
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    for (const user of allUsers) {
      if (user.preferences?.pushNotifications && user.preferences?.streakReminders) {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const completedRecently = tasks.filter((t) =>
          t.completed && t.completedAt && t.completedAt >= twentyFourHoursAgo
        );

        if (completedRecently.length === 0) {
          const subs = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
          if (subs.length > 0) targets.push({ subs });
        }
      }
    }
    return targets;
  },
});

export const processStreakSavers = internalAction({
  args: {},

  handler: async (ctx): Promise<{ status: string; usersFound: number; notificationsFired: number }> => {
    const targets = await ctx.runQuery(internal.notifications.getStreakSaverTargets);

    let sentCount = 0;
    for (const { subs } of targets) {
      for (const sub of subs) {
        await ctx.runAction(internal.pushActions.sendPush, {
          subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          title: "🔥 Protect Your Streak!",
          body: "You haven't completed any tasks recently. Knock out one quick task to keep your momentum going.",
          url: "/dashboard",
        });
        sentCount++;
      }
    }

    return {
      status: "Success",
      usersFound: targets.length,
      notificationsFired: sentCount
    };
  },
});

// 3. AI QUOTA RESET (Morning)
export const getAiQuotaResetTargets = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const targets = [];

    // The AI Quota logic uses the aiUsage table which tracks exact UTC dates, 
    // so this remains safely tied to UTC midnight resets.
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayString = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;

    for (const user of allUsers) {
      if (user.preferences?.pushNotifications && user.preferences?.aiQuotaAlerts && user.preferences?.enableAiFeatures) {

        // Did they hit the limit of 8 yesterday?
        const usageYesterday = await ctx.db
          .query("aiUsage")
          .withIndex("by_user_and_date", (q) => q.eq("userId", user._id).eq("date", yesterdayString))
          .first();

        if (usageYesterday && usageYesterday.count >= 8) {
          const subs = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
          if (subs.length > 0) targets.push({ subs });
        }
      }
    }
    return targets;
  },
});

export const processAiQuotaResets = internalAction({
  args: {},

  handler: async (ctx): Promise<{ status: string; usersFound: number; notificationsFired: number }> => {
    const targets = await ctx.runQuery(internal.notifications.getAiQuotaResetTargets);

    let sentCount = 0;
    for (const { subs } of targets) {
      for (const sub of subs) {
        await ctx.runAction(internal.pushActions.sendPush, {
          subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          title: "✨ AI Quota Refilled!",
          body: "Your daily limit of 8 AI requests has been reset. Get back to generating smart goals and insights!",
          url: "/dashboard",
        });
        sentCount++;
      }
    }

    return {
      status: "Success",
      usersFound: targets.length,
      notificationsFired: sentCount
    };
  },
});