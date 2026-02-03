"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentGoals } from "@/components/dashboard/recent-goals";
import { TodayTasks } from "@/components/dashboard/today-tasks";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";

export default function DashboardPage() {
  const { userId } = useAuth();

  const goals = useQuery(api.goals.getByUser, userId ? { userId } : "skip");
  const tasks = useQuery(api.tasks.getByUser, userId ? { userId } : "skip");
  const stats = useQuery(api.tasks.getStats, userId ? { userId } : "skip");

  const isLoading = goals === undefined || tasks === undefined || stats === undefined;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      {/* Welcome Section */}
      <div className="animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Welcome back!
        </h1>
        <p className="text-muted-foreground">
          Track your progress and achieve your goals.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalGoals={goals?.length || 0}
        activeGoals={goals?.filter((g) => g.status === "active").length || 0}
        completedTasks={stats?.totalCompleted || 0}
        pendingTasks={stats?.totalPending || 0}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentGoals goals={goals || []} />
        <TodayTasks userId={userId!} />
      </div>
    </div>
  );
}
