import { Skeleton } from "@/components/ui/skeleton";

export function NoteCardSkeleton() {
  return (
    <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl mb-4 break-inside-avoid shadow-sm p-0 overflow-hidden">
      <div className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-sm bg-muted/50" />
          <Skeleton className="w-24 h-4 bg-muted/50" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-6 h-6 rounded-md bg-muted/50" />
          <Skeleton className="w-6 h-6 rounded-md bg-muted/50" />
        </div>
      </div>
      <div className="p-4 pt-2 space-y-2">
        <Skeleton className="w-full h-4 bg-muted/50" />
        <Skeleton className="w-3/4 h-4 bg-muted/50" />
        <Skeleton className="w-5/6 h-4 bg-muted/50" />
      </div>
    </div>
  );
}

export function NoteListSkeleton() {
  return (
    <div className="columns-1 sm:columns-[300px] 2xl:columns-[380px] gap-4 space-y-4">
      {[...Array(6)].map((_, i) => (
        <NoteCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function NotesPageSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-65px)] space-y-3 pb-16 lg:pb-0 animate-pulse">

      {/* Header Skeleton */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-muted/60" />
          <Skeleton className="h-4 w-72 bg-muted/40" />
        </div>
      </div>

      {/* Main IDE Layout Skeleton */}
      <div className="flex flex-col lg:flex-row lg:gap-8 gap-4 flex-1 min-h-0">

        {/* LEFT PANE: FILE EXPLORER SKELETON */}
        <div className="w-full lg:w-72 xl:w-80 flex flex-col bg-card/50 backdrop-blur-xl border border-border rounded-xl shadow-lg shrink-0 h-auto lg:h-full overflow-hidden">

          {/* Top Bar (Matches the mobile/desktop layout of actual UI) */}
          <div className="p-3 lg:p-4 border-b border-border bg-black/20 flex flex-row lg:flex-col items-center lg:items-stretch gap-3 shrink-0">
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="w-5 h-5 rounded bg-muted/50" />
              <Skeleton className="h-3 w-16 hidden lg:block bg-muted/50" />
            </div>

            <div className="flex-1 lg:w-full">
              <Skeleton className="h-9 w-full rounded-md bg-muted/50" />
            </div>

            {/* Mobile Menu Button Skeleton */}
            <Skeleton className="h-9 w-9 rounded-md shrink-0 lg:hidden bg-muted/50" />
          </div>

          {/* Folder List (Hidden on mobile to match the closed state) */}
          <div className="hidden lg:flex flex-col p-3 space-y-3 flex-1 overflow-hidden opacity-70">
            <Skeleton className="h-8 w-full rounded-md bg-muted/40" />
            <Skeleton className="h-8 w-5/6 rounded-md bg-muted/40" />
            <Skeleton className="h-8 w-4/6 rounded-md bg-muted/40" />
            <Skeleton className="h-8 w-full rounded-md bg-muted/40" />
          </div>
        </div>

        {/* RIGHT PANE: VIEWER SKELETON */}
        <div className="flex-1 bg-card/30 backdrop-blur-xl border border-border rounded-xl shadow-lg relative h-full flex flex-col overflow-hidden">

          {/* Right Pane Header */}
          <div className="flex flex-row items-center justify-between gap-4 px-5 py-3 border-b border-white/5 bg-black/10 shrink-0">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-md bg-muted/50" />
              <Skeleton className="h-6 w-32 md:w-48 bg-muted/50" />
            </div>
            <Skeleton className="h-8 w-24 rounded-3xl bg-[#6499E9]/30" />
          </div>

          {/* Right Pane Grid */}
          <div className="flex-1 overflow-y-auto p-3.5 md:px-6 ">
            <NoteListSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}