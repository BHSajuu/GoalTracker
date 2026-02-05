"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentGoals } from "@/components/dashboard/recent-goals";
import { TodayTasks } from "@/components/dashboard/today-tasks";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StreakCalendar } from "@/components/dashboard/streak-calendar";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";

export default function DashboardPage() {
  const { userId } = useAuth();

  const goals = useQuery(api.goals.getByUser, userId ? { userId } : "skip");
  const stats = useQuery(api.tasks.getStats, userId ? { userId } : "skip");

  const isLoading = goals === undefined || stats === undefined;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      
      {/* Welcome Section  */}
      <div className="flex flex-col xl:flex-row gap-8 xl:gap-16">
        <div className="flex-1 flex flex-col gap-8">
          <div className="animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome back!
            </h1>
            <p className="text-muted-foreground">
              Track your progress and achieve your goals.
            </p>
          </div>

          <div className="space-y-6">
            <StatsCards
              totalGoals={goals?.length || 0}
              activeGoals={goals?.filter((g) => g.status === "active").length || 0}
              currentStreak={stats?.currentStreak || 0}
            />
            <QuickActions />
          </div>
        </div>

        {/* Calendar*/}
        <div className="xl:pt-20 w-full xl:w-auto flex justify-center xl:block animate-fade-in">
          <StreakCalendar activeDays={stats?.activeDays || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentGoals goals={goals || []} />
        <TodayTasks userId={userId!} />
      </div>
    </div>
  );
}