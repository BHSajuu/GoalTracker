import { Skeleton } from "@/components/ui/skeleton";

export function StatsCardsSkeleton() {
      return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card p-6 rounded-2xl border border-secondary/20">
                              <div className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-xl" />
                                    <div className="space-y-2">
                                          <Skeleton className="h-8 w-16" />
                                          <Skeleton className="h-4 w-24" />
                                    </div>
                              </div>
                        </div>
                  ))}
            </div>
      );
}

export function RecentGoalsSkeleton() {
      return (
            <div className="glass-card p-6 rounded-2xl h-full border border-secondary/20">
                  <div className="flex items-center justify-between mb-6">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                  </div>
                  <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/5">
                                    <Skeleton className="w-12 h-12 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                          <Skeleton className="h-5 w-40" />
                                          <Skeleton className="h-3 w-full max-w-[200px]" />
                                          <Skeleton className="h-2 w-full rounded-full" />
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
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                  </div>
                  <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-secondary/10">
                                    <Skeleton className="w-5 h-5 rounded" />
                                    <div className="flex-1">
                                          <Skeleton className="h-5 w-3/4 mb-1" />
                                          <div className="flex gap-2">
                                                <Skeleton className="h-3 w-16" />
                                                <Skeleton className="h-3 w-16" />
                                          </div>
                                    </div>
                              </div>
                        ))}
                  </div>
            </div>
      );
}

export function DashboardSkeleton() {
      return (
            <div className="space-y-8 pb-20 lg:pb-8">
                  <div className="space-y-2">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-5 w-96" />
                  </div>

                  <StatsCardsSkeleton />

                  <div className="flex gap-4 overflow-x-auto pb-2">
                        {[...Array(4)].map((_, i) => (
                              <Skeleton key={i} className="h-32 w-48 shrink-0 rounded-2xl" />
                        ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RecentGoalsSkeleton />
                        <TodayTasksSkeleton />
                  </div>
            </div>
      );
}
