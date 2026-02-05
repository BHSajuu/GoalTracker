import { Skeleton } from "@/components/ui/skeleton";

export function GoalCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-secondary/20 h-full flex flex-col">
      {/* Color Strip */}
      <Skeleton className="h-1 w-full" />

      <div className="p-5 flex flex-col flex-1">
        {/* Header: Title + Badge + Menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>

        {/* Description */}
        <div className="space-y-2 mb-6 flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Progress */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between">
             <Skeleton className="h-3 w-16" />
             <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function GoalsPageSkeleton() {
  return (
    <div className="space-y-8 pb-20 lg:pb-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>

      {/* Controls Toolbar */}
      <div className="glass-card p-4 rounded-2xl border border-secondary/20 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>

          {/* Filters Group */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-12 w-full sm:w-[180px] rounded-xl" />
            <Skeleton className="h-12 w-full sm:w-[180px] rounded-xl" />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <GoalCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}