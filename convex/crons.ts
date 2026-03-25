import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 1. Task Reminders: Runs every 15 minutes to accurately capture half-hour 
// and quarter-hour timezones (like IST UTC+5:30)
crons.cron(
  "Task Reminders (15m interval)",
  "*/15 * * * *",
  internal.notifications.processTaskReminders
);

// 2. Streak Savers: Runs every 15 minutes
crons.cron(
  "Streak Savers (15m interval)",
  "*/15 * * * *",
  internal.notifications.processStreakSavers
);

// 3. AI Quota Reset: Runs every 15 minutes
crons.cron(
  "AI Quota Reset (15m interval)",
  "*/15 * * * *",
  internal.notifications.processAiQuotaResets
);

export default crons;