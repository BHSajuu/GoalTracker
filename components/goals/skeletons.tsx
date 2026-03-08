import { Skeleton } from "@/components/ui/skeleton";

export function GoalCardSkeleton() {
  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/50 h-full min-h-[250px] flex flex-col">
      {/* Color Strip */}
      <Skeleton className="h-1.5 w-full bg-muted/60" />

      <div className="p-5 flex flex-col flex-1">
        {/* Header: Title + Badge + Menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4 bg-muted/50" />
            <Skeleton className="h-5 w-20 rounded-full bg-muted/50" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md bg-muted/50" />
        </div>

        {/* Description */}
        <div className="space-y-2 mb-6 flex-1">
          <Skeleton className="h-4 w-full bg-muted/50" />
          <Skeleton className="h-4 w-5/6 bg-muted/50" />
        </div>

        {/* Progress */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16 bg-muted/50" />
            <Skeleton className="h-3 w-8 bg-muted/50" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full bg-muted/50" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
          <Skeleton className="h-4 w-24 bg-muted/50" />
          <Skeleton className="h-5 w-16 rounded-full bg-muted/50" />
        </div>
      </div>
    </div>
  );
}

export function GoalsPageSkeleton() {
  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-pulse">

      {/* Header Section */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <Skeleton className="h-7 md:h-9 w-32 md:w-48 mb-2 bg-muted/60" />
          <Skeleton className="h-4 w-48 md:w-64 bg-muted/40" />
        </div>
        {/* Matches the specific rounded-3xl and width of your new 'New Goal' button */}
        <Skeleton className="h-9 lg:h-10 w-32 lg:w-36 rounded-3xl bg-[#6499E9]/30" />
      </div>

      {/* Filters Section (No more wrapper card, matches direct flex-col/row layout) */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Skeleton className="h-10 w-full rounded-md bg-secondary/50" />
        </div>

        {/* Filters Group */}
        <div className="flex gap-2">
          {/* Matches the w-40 and w-46 widths from your Select components */}
          <Skeleton className="h-10 w-40 rounded-md bg-secondary/50 shrink-0" />
          <Skeleton className="h-10 w-[184px] rounded-md bg-secondary/50 shrink-0" />
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
        {[...Array(8)].map((_, i) => (
          <GoalCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}