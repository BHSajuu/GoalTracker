import { Skeleton } from "@/components/ui/skeleton";

export function GoalDetailSkeleton() {
  return (
    <div className="space-y-5 pb-20 lg:pb-8 max-w-400 mx-auto animate-pulse">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Info & Tasks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card Skeleton */}
          <div className="p-8 rounded-3xl border border-secondary/20 relative overflow-hidden space-y-4">
             {/* Simulating the header layout */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 w-full">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
              <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
            </div>

            {/* Description lines */}
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Progress Section */}
            <div className="pt-4 border-t border-border/40 mt-4 space-y-3">
              <div className="flex justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-4 w-32 self-end" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>

          {/* Tasks Section Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Stats Grid */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-24 px-2" />

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-secondary/20 flex items-center gap-4"
              >
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-10" />
                </div>
              </div>
            ))}
          </div>

          {/* Quote Area Skeleton */}
          <Skeleton className="h-24 w-full rounded-2xl mt-8" />
        </div>
      </div>
    </div>
  );
}