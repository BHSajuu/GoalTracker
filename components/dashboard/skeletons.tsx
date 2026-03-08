import { Skeleton } from "@/components/ui/skeleton";

export function StatsCardsSkeleton() {
  return (
    // Mobile: Flex + Horizontal Scroll | Desktop: Grid
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:gap-7 md:grid-cols-3 md:overflow-visible snap-x snap-mandatory hide-scrollbar">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="min-w-[85vw] md:min-w-0 snap-center bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 p-6 flex flex-col items-center justify-center space-y-3 shadow-sm"
        >
          <div className="flex items-center gap-3 w-full justify-center">
            <Skeleton className="h-4 w-24 bg-muted/50" />
            <Skeleton className="h-6 w-6 rounded-full bg-muted/50" />
          </div>
          <Skeleton className="h-8 w-16 bg-muted/60" />
          <Skeleton className="h-3 w-20 bg-muted/40" />
        </div>
      ))}
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-32 mb-4 bg-muted/60" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-7">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card/30 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 border border-border/50 shadow-sm">
            <Skeleton className="w-12 h-12 rounded-xl bg-muted/50 shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-20 bg-muted/60" />
              <Skeleton className="h-3 w-3/4 bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StreakCalendarSkeleton() {
  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 p-5 h-[320px] w-full max-w-[320px] flex flex-col gap-4 shadow-sm">
      <div className="flex justify-between items-center px-2">
        <Skeleton className="h-5 w-5 rounded-md bg-muted/50" />
        <Skeleton className="h-5 w-24 bg-muted/60" />
        <Skeleton className="h-5 w-5 rounded-md bg-muted/50" />
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {[...Array(35)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-md bg-muted/40" />
        ))}
      </div>
    </div>
  );
}

export function RecentGoalsSkeleton() {
  return (
    <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl h-full border border-border/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32 bg-muted/60" />
        <Skeleton className="h-4 w-16 bg-muted/50" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/10 border border-white/5">
            <Skeleton className="w-3 h-3 rounded-full shrink-0 bg-muted/50" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32 bg-muted/60" />
                <Skeleton className="h-3 w-8 bg-muted/50" />
              </div>
              <Skeleton className="h-3 w-20 bg-muted/50" />
              <Skeleton className="h-1.5 w-full rounded-full bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TodayTasksSkeleton() {
  return (
    <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl h-full border border-border/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-36 bg-muted/60" />
        <Skeleton className="h-4 w-16 bg-muted/50" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-secondary/5">
            <Skeleton className="w-5 h-5 rounded-full shrink-0 bg-muted/50" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 bg-muted/60" />
              <Skeleton className="h-3 w-1/3 bg-muted/40" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full bg-muted/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-24 lg:pb-8 animate-pulse">
      {/* Top Section: Welcome + Stats/Actions + Calendar */}
      <div className="flex flex-col xl:flex-row gap-8 xl:gap-16">

        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-8">

          {/* Header Row: Welcome Text & Real-Time Clock */}
          <div className="flex flex-col md:flex-row md:items-center justify-between md:justify-start gap-6 md:gap-70">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 bg-muted/60" />
              <Skeleton className="h-4 w-64 bg-muted/40" />
            </div>
            {/* Clock Skeleton */}
            <Skeleton className="h-12 w-48 rounded-2xl bg-muted/30" />
          </div>

          {/* Schedule Healing Alert Skeleton */}
          {/* <Skeleton className="h-16 w-full rounded-2xl bg-[#6499E9]/20 border border-[#6499E9]/30" /> */}

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