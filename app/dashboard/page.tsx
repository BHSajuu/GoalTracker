"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentGoals } from "@/components/dashboard/recent-goals";
import { TodayTasks } from "@/components/dashboard/today-tasks";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StreakCalendar } from "@/components/dashboard/streak-calendar"; // Import the new calendar
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
    <div className="space-y-8 pb-20 lg:pb-8">
      {/* Welcome Section */}
      <div className="flex gap-16">
        <div className="flex flex-col gap-10">
          <div className="animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome back !
            </h1>
            <p className="text-muted-foreground">
              Track your progress and achieve your goals.
            </p>
          </div>


          <div className="lg:col-span-3 space-y-6">
            <StatsCards
              totalGoals={goals?.length || 0}
              activeGoals={goals?.filter((g) => g.status === "active").length || 0}
              currentStreak={stats?.currentStreak || 0}
            />
            <QuickActions />
          </div>

        </div>

        <div className="pt-15 m-3">
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