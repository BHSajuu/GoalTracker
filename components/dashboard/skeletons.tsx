import { Skeleton } from "@/components/ui/skeleton";

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-3 md:gap-7 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="glass p-6 rounded-xl border border-border/50 flex flex-col items-center justify-center space-y-3"
        >
          <div className="flex items-center gap-3 w-full justify-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-32 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StreakCalendarSkeleton() {
  return (
    <div className="rounded-lg border-2 border-border/50 p-3 h-[320px] w-full max-w-[300px] flex flex-col gap-4">
      <div className="flex justify-between items-center px-2">
         <Skeleton className="h-4 w-4" />
         <Skeleton className="h-4 w-24" />
         <Skeleton className="h-4 w-4" />
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
          {[...Array(35)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-md" />
          ))}
      </div>
    </div>
  );
}

export function RecentGoalsSkeleton() {
  return (
    <div className="glass-card p-6 rounded-2xl h-full border border-secondary/20">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/5">
            <Skeleton className="w-3 h-3 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TodayTasksSkeleton() {
  return (
    <div className="glass-card p-6 rounded-2xl h-full border border-secondary/20">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-secondary/10">
            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      {/* Top Section: Welcome + Stats/Actions + Calendar */}
      <div className="flex flex-col xl:flex-row gap-8 xl:gap-16">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Welcome Text */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="space-y-6">
            <StatsCardsSkeleton />
            <QuickActionsSkeleton />
          </div>
        </div>

        {/* Right Column: Calendar */}
        <div className="xl:pt-20 w-full xl:w-auto flex justify-center xl:block">
           <StreakCalendarSkeleton />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentGoalsSkeleton />
        <TodayTasksSkeleton />
      </div>
    </div>
  );
}