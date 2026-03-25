import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 1. Task Reminders: Runs every hour exactly on the hour
crons.hourly(
  "Hourly Local Task Reminders",
  { minuteUTC: 0 },
  internal.notifications.processTaskReminders
);

// 2. Streak Savers: Runs every hour exactly on the hour
crons.hourly(
  "Hourly Local Streak Savers",
  { minuteUTC: 0 },
  internal.notifications.processStreakSavers
);

// 3. AI Quota Reset: Runs every hour exactly on the hour
crons.hourly(
  "Hourly Local AI Quota Reset",
  { minuteUTC: 0 },
  internal.notifications.processAiQuotaResets
);

export default crons;