import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 pb-24 lg:pb-8 animate-pulse overflow-x-hidden w-full">

      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-9 w-48 mb-1 bg-muted/60" />
          <Skeleton className="h-4 w-64 bg-muted/40" />
        </div>
        {/* Ask AI Button Skeleton */}
        <Skeleton className="h-9 w-44 rounded-3xl bg-[#19183B]/50 mr-3 shrink-0" />
      </div>

      {/* Summary Cards Skeleton (Maps to AnalyticsStatsCards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20 bg-muted/50" />
              <Skeleton className="h-4 w-4 rounded-full bg-muted/50" />
            </div>
            <Skeleton className="h-8 w-16 bg-muted/60" />
          </div>
        ))}
      </div>

      {/* Row 1: Weekly Progress & Priorities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        {/* Weekly Progress - 4/7 cols */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[350px] min-w-0 bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col">
          <Skeleton className="h-6 w-48 mb-6 bg-muted/60" />
          <Skeleton className="flex-1 w-full rounded-xl bg-muted/20" />
        </div>

        {/* Priority Chart - 3/7 cols */}
        <div className="lg:mt-5 col-span-1 md:col-span-2 lg:col-span-3 min-h-[350px] min-w-0 bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col">
          <Skeleton className="h-6 w-36 mb-6 bg-muted/60" />
          <Skeleton className="flex-1 w-full rounded-xl bg-muted/20" />
        </div>
      </div>

      {/* Row 2: Efficiency & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        {/* Efficiency Chart - 4/7 cols */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[400px] min-w-0 bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col">
          <Skeleton className="h-6 w-40 mb-6 bg-muted/60" />
          <Skeleton className="flex-1 w-full rounded-xl bg-muted/20" />
        </div>

        {/* Category Breakdown - 3/7 cols */}
        <div className="lg:mt-18 col-span-1 md:col-span-2 lg:col-span-3 min-h-[400px] min-w-0 bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col">
          <Skeleton className="h-6 w-48 mb-6 bg-muted/60" />
          <Skeleton className="flex-1 w-full rounded-xl bg-muted/20" />
        </div>
      </div>

      {/* Row 3: Goal Status & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        {/* Goal Distribution - 3/7 cols */}
        <div className="col-span-1 md:col-span-1 lg:col-span-3 min-h-[350px] min-w-0 bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col">
          <Skeleton className="h-6 w-40 mb-6 bg-muted/60" />
          <Skeleton className="flex-1 w-full rounded-xl bg-muted/20" />
        </div>

        {/* Goal Progress - 4/7 cols */}
        <div className="col-span-1 md:col-span-1 lg:col-span-4 min-h-[350px] min-w-0 bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col">
          <Skeleton className="h-6 w-32 mb-6 bg-muted/60" />
          <Skeleton className="flex-1 w-full rounded-xl bg-muted/20" />
        </div>
      </div>

    </div>
  );
}