/**
 * This file queries your database to figure out 
 * who needs a notification based on the preferences and local timezone
 */

import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Helper function to calculate if it's the exact target hour in the user's local timezone
function isTargetLocalTime(timezone: string | undefined, targetHour: number): boolean {
  const tz = timezone || "UTC";
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const hourStr = parts.find(p => p.type === 'hour')?.value;
    const minuteStr = parts.find(p => p.type === 'minute')?.value;

    let localHour = parseInt(hourStr || "0", 10);
    let localMinute = parseInt(minuteStr || "0", 10);

    // Standardize midnight (some environments output 24 instead of 0)
    if (localHour === 24) localHour = 0;

    // CRON runs every 15 mins. We ONLY want to trigger the notification 
    // at the top of the user's local hour (between XX:00 and XX:14).
    return localHour === targetHour && localMinute >= 0 && localMinute < 15;
  } catch (e) {
    // Fallback if timezone is invalid
    console.warn(`Invalid timezone ${tz}, falling back to UTC`);
    const now = new Date();
    return now.getUTCHours() === targetHour && now.getUTCMinutes() < 15;
  }
}

// 1. TASK REMINDERS (Morning - 9 AM Local)
export const getTaskReminderTargets = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const targets = [];
    const now = Date.now();
    const endOfToday = now + 24 * 60 * 60 * 1000;

    for (const user of allUsers) {
      if (!isTargetLocalTime(user.timezone, 9)) continue;

      if (user.preferences?.pushNotifications && user.preferences?.taskReminders) {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        let todayCount = 0;
        let overdueCount = 0;

        // Advanced Counting Logic
        tasks.forEach((t) => {
          if (!t.completed && !t.isArchived && t.dueDate) {
            if (t.dueDate < now) {
              overdueCount++;
            } else if (t.dueDate <= endOfToday) {
              todayCount++;
            }
          }
        });

        if (todayCount > 0 || overdueCount > 0) {
          const subs = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
          if (subs.length > 0) {
            targets.push({ todayCount, overdueCount, subs });
          }
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

    for (const { todayCount, overdueCount, subs } of targets) {

      // Dynamic Message Generation
      let body = "";
      if (todayCount > 0 && overdueCount > 0) {
        body = `You have ${todayCount} task(s) for today and ${overdueCount} overdue task(s). Let's catch up!`;
      } else if (todayCount > 0) {
        body = `You have ${todayCount} task(s) on your agenda today. Let's get to work!`;
      } else {
        body = `You have ${overdueCount} overdue task(s) waiting for you. Time to clear the backlog!`;
      }

      for (const sub of subs) {
        await ctx.runAction(internal.pushActions.sendPush, {
          subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          title: "🎯 Daily Targets Ready",
          body: body,
          url: "/dashboard/tasks",
        });
        sentCount++;
      }
    }
    return { status: "Success", usersFound: targets.length, notificationsFired: sentCount };
  },
});


// 2. STREAK SAVERS (Evening - 8 PM / 20:00 Local)
export const getStreakSaverTargets = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const targets = [];
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    for (const user of allUsers) {
      if (!isTargetLocalTime(user.timezone, 12.15)) continue;

      if (user.preferences?.pushNotifications && user.preferences?.streakReminders) {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const completedRecently = tasks.some((t) =>
          t.completed && t.completedAt && t.completedAt >= twentyFourHoursAgo
        );

        if (!completedRecently) {
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
          body: "You haven't completed any tasks today. Knock out one quick task to keep your momentum going.",
          url: "/dashboard",
        });
        sentCount++;
      }
    }
    return { status: "Success", usersFound: targets.length, notificationsFired: sentCount };
  },
});

// 3. AI QUOTA RESET (Morning - 8 AM Local)
export const getAiQuotaResetTargets = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const targets = [];

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayString = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;

    for (const user of allUsers) {
      if (!isTargetLocalTime(user.timezone, 8)) continue;

      if (user.preferences?.pushNotifications && user.preferences?.aiQuotaAlerts && user.preferences?.enableAiFeatures) {
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
    return { status: "Success", usersFound: targets.length, notificationsFired: sentCount };
  },
});