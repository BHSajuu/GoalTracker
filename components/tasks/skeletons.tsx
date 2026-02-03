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

                  {/* Stats Skeleton */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                              <div key={i} className="glass-card rounded-xl p-4 border border-secondary/20">
                                    <div className="flex items-center gap-3">
                                          <Skeleton className="w-10 h-10 rounded-lg" />
                                          <div className="space-y-1">
                                                <Skeleton className="h-6 w-8" />
                                                <Skeleton className="h-3 w-12" />
                                          </div>
                                    </div>
                              </div>
                        ))}
                  </div>

                  {/* Filters Skeleton */}
                  <div className="flex flex-col sm:flex-row gap-4">
                        <Skeleton className="h-10 flex-1 max-w-md" />
                        <div className="flex gap-2">
                              <Skeleton className="h-10 w-35" />
                              <Skeleton className="h-10 w-40" />
                        </div>
                  </div>

                  {/* Tabs Skeleton */}
                  <div className="space-y-6">
                        <Skeleton className="h-10 w-75" />
                        <div className="grid grid-cols-1 md:grid-cols-2  gap-4">
                              {[...Array(5)].map((_, i) => (
                                    <div key={i} className="p-4 rounded-xl border border-secondary/10 flex items-center justify-between">
                                          <div className="flex items-center gap-4 flex-1">
                                                <Skeleton className="w-5 h-5 rounded" />
                                                <div className="space-y-2 flex-1">
                                                      <Skeleton className="h-5 w-1/2" />
                                                      <Skeleton className="h-3 w-1/3" />
                                                </div>
                                          </div>
                                    </div>
                              ))}
                        </div>
                  </div>
            </div>
      );
}
