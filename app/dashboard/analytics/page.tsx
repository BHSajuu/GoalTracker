"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { WeeklyProgressChart } from "@/components/analytics/weekly-progress-chart";
import { GoalDistributionChart } from "@/components/analytics/goal-distribution-chart";
import { TasksByPriorityChart } from "@/components/analytics/tasks-by-priority-chart";
import { GoalProgressChart } from "@/components/analytics/goal-progress-chart";
import { CategoryBreakdownChart } from "@/components/analytics/category-breakdown-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Target, CheckCircle2 } from "lucide-react";

export default function AnalyticsPage() {
  const { userId } = useAuth();

  const goals = useQuery(api.goals.getByUser, userId ? { userId } : "skip");
  const tasks = useQuery(api.tasks.getByUser, userId ? { userId } : "skip");
  const stats = useQuery(api.tasks.getStats, userId ? { userId } : "skip");

  const isLoading =
    goals === undefined || tasks === undefined || stats === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const activeGoals = goals?.filter((g) => g.status === "active").length || 0;
  const completedGoals =
    goals?.filter((g) => g.status === "completed").length || 0;
  const avgProgress =
    goals && goals.length > 0
      ? Math.round(
          goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
        )
      : 0;
  const completionRate =
    tasks && tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.completed).length / tasks.length) * 100
        )
      : 0;

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Track your progress and performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex flex-col items-center justify-center gap-1 glass-card rounded-2xl p-5">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{activeGoals}</p>
          <p className="text-sm text-muted-foreground">Active Goals</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{completedGoals}</p>
          <p className="text-sm text-muted-foreground">Completed Goals</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{avgProgress}%</p>
          <p className="text-sm text-muted-foreground">Avg Progress</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {completionRate}%
          </p>
          <p className="text-sm text-muted-foreground">Task Completion</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyProgressChart data={stats?.dailyData || []} />
        <GoalDistributionChart goals={goals || []} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksByPriorityChart tasks={tasks || []} />
        <CategoryBreakdownChart goals={goals || []} tasks={tasks || []} />
      </div>

      {/* Goal Progress Overview */}
      <GoalProgressChart goals={goals || []} />
    </div>
  );
}
