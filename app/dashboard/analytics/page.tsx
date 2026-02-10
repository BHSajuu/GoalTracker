"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { WeeklyProgressChart } from "@/components/analytics/weekly-progress-chart";
import { GoalDistributionChart } from "@/components/analytics/goal-distribution-chart";
import { CategoryBreakdownChart } from "@/components/analytics/category-breakdown-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsStatsCards } from "@/components/analytics/analytics-stats-cards";
import { EfficiencyChart } from "@/components/analytics/efficiency-chart";
import { TasksByPriorityChart } from "@/components/analytics/tasks-by-priority-chart";
import { GoalProgressChart } from "@/components/analytics/goal-progress-chart";

export default function AnalyticsPage() {
  const { userId } = useAuth();
  const queryArgs = userId ? { userId } : "skip";

  const goals = useQuery(api.goals.getByUser, queryArgs);
  const tasks = useQuery(api.tasks.getByUser, queryArgs);
  const stats = useQuery(api.tasks.getStats, queryArgs);

  const isLoading = goals === undefined || tasks === undefined || stats === undefined;

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-6 h-full p-4 overflow-x-hidden">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const activeGoals = goals?.filter((g) => g.status === "active").length || 0;
  const completedGoals = goals?.filter((g) => g.status === "completed").length || 0;
  const avgProgress = goals && goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;
  const completionRate = tasks && tasks.length > 0
    ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-24 lg:pb-8 animate-in fade-in duration-500 overflow-x-hidden w-full">
      {/* Header */}
      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground text-glow">
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Track your progress and performance metrics.
        </p>
      </div>

      {/* Summary Cards */}

      <AnalyticsStatsCards
        activeGoals={activeGoals}
        completedGoals={completedGoals}
        avgProgress={avgProgress}
        completionRate={completionRate}
      />


      {/* Row 1: Weekly Progress & Priorities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">

        {/* Weekly Progress - Takes 4/7 on desktop */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[350px] min-w-0">
          <WeeklyProgressChart data={stats.dailyData} />
        </div>

        {/* Priority Chart - Takes 3/7 on desktop */}
        <div className="lg:mt-5 col-span-1 md:col-span-2 lg:col-span-3 min-h-[350px] min-w-0">
          <TasksByPriorityChart tasks={tasks || []} />
        </div>
      </div>

      {/* Row 2: Efficiency & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">

        {/* Efficiency Chart - Takes 4/7 on desktop */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[400px] min-w-0">
          {userId && <EfficiencyChart userId={userId} />}
        </div>

        {/* Category Breakdown - Takes 3/7 on desktop */}
        <div className="lg:mt-18 col-span-1 md:col-span-2 lg:col-span-3 min-h-[400px] min-w-0">
          <CategoryBreakdownChart goals={goals || []} tasks={tasks || []} />
        </div>
      </div>

      {/* Row 3: Goal Status & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">

        {/* Goal Distribution - Takes 3/7 on desktop */}
        <div className="lg:mt-5 col-span-1 md:col-span-1 lg:col-span-3 min-h-[350px] min-w-0">
          <GoalDistributionChart goals={goals || []} />
        </div>

        {/* Goal Progress - Takes 4/7 on desktop */}
        <div className="col-span-1 md:col-span-1 lg:col-span-4 min-h-[350px] min-w-0">
          <GoalProgressChart goals={goals || []} />
        </div>
      </div>

    </div>
  );
}