import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 pb-24 lg:pb-8 overflow-x-hidden w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-1 px-1">
        <Skeleton className="h-9 w-48 mb-1" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="md:mx-10 grid grid-cols-2 lg:grid-cols-4 md:gap-16 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-center gap-2 space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1: Weekly Progress & Priorities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        {/* Weekly Progress - 4/7 cols */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[350px]">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>

        {/* Priority Chart - 3/7 cols */}
        <div className="lg:mt-5 col-span-1 md:col-span-2 lg:col-span-3 min-h-[350px]">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>
      </div>

      {/* Row 2: Efficiency & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        {/* Efficiency Chart - 4/7 cols */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[400px]">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>

        {/* Category Breakdown - 3/7 cols */}
        <div className="lg:mt-18 col-span-1 md:col-span-2 lg:col-span-3 min-h-[400px]">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>
      </div>

      {/* Row 3: Goal Status & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        {/* Goal Distribution - 3/7 cols */}
        <div className="lg:mt-5 col-span-1 md:col-span-1 lg:col-span-3 min-h-[350px]">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>

        {/* Goal Progress - 4/7 cols */}
        <div className="col-span-1 md:col-span-1 lg:col-span-4 min-h-[350px]">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}