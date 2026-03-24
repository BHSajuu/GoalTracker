import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 1. Task Reminders: Runs every day at 9:00 AM UTC
crons.daily(
  "Morning Task Reminders",
  { hourUTC: 9, minuteUTC: 0 },
  internal.notifications.processTaskReminders
);

// 2. Streak Savers: Runs every day at 8:00 PM UTC
crons.daily(
  "Evening Streak Savers",
  { hourUTC: 20, minuteUTC: 0 },
  internal.notifications.processStreakSavers
);

// 3. AI Quota Reset: Runs every day at 8:00 AM UTC
crons.daily(
  "Morning AI Quota Reset",
  { hourUTC: 8, minuteUTC: 0 },
  internal.notifications.processAiQuotaResets
);

export default crons;