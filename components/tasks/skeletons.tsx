import { Skeleton } from "@/components/ui/skeleton";

export function TasksPageSkeleton() {
  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

     

      {/* Tabs & Filters Skeleton */}
      {/* Matches the flex-col-reverse lg:flex-row layout */}
      <div className="flex flex-col-reverse lg:flex-row lg:items-center justify-between gap-4 mb-6">
        
        {/* Tabs List */}
        <Skeleton className="h-10 w-full sm:w-[400px]" />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 lg:w-auto w-full">
          <Skeleton className="h-10 flex-1 lg:w-64" /> {/* Search */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" /> {/* Priority */}
            <Skeleton className="h-10 w-32" /> {/* Goal */}
          </div>
        </div>
      </div>

      {/* Task Items Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="p-4 rounded-xl border border-secondary/20 bg-card/30 flex items-start gap-3"
          >
            {/* Checkbox */}
            <Skeleton className="w-5 h-5 rounded mt-1 shrink-0" />
            
            <div className="flex-1 space-y-3">
              {/* Title and Priority Badge */}
              <div className="flex items-start justify-between gap-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-16 rounded-full opacity-70" />
              </div>
              
              {/* Metadata (Goal tag & Date) */}
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}