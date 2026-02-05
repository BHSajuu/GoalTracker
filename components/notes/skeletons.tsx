import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function NoteCardSkeleton() {
  return (
    <Card className="glass md:w-96 mb-4 break-inside-avoid border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-sm" />
          <Skeleton className="w-24 h-3" />
        </div>
        <div className="flex gap-2">
             <Skeleton className="w-6 h-6 rounded-md" />
             <Skeleton className="w-6 h-6 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-2">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-3/4 h-4" />
          <Skeleton className="w-5/6 h-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export function NoteListSkeleton() {
    return (
        <div className="columns-1 lg:columns-2 space-y-4">
            {[...Array(4)].map((_, i) => (
                <NoteCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function NotesPageSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <div className="space-y-2 flex-shrink-0 animate-pulse">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start h-full overflow-hidden">
        {/* Sidebar Skeleton */}
        <Card className="w-full md:w-1/3 lg:w-1/4 glass border-border/50 flex-shrink-0">
          <CardContent className="p-4 space-y-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="p-4 mt-4 rounded-lg border border-border/30 flex flex-col items-center gap-2">
                 <Skeleton className="h-8 w-8 rounded-sm" />
                 <Skeleton className="h-3 w-40" />
            </div>
          </CardContent>
        </Card>

        {/* Content Skeleton */}
        <div className="flex-1 w-full h-full flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4 flex-shrink-0 pr-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar">
            <NoteListSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}