"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { TaskItem } from "@/components/tasks/task-item";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { PlanDayDialog } from "@/components/tasks/plan-day-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TasksPageSkeleton } from "@/components/tasks/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  CheckSquare,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const TASKS_PER_PAGE = 10;

export default function TasksPage() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  // Filter States
  const [searchInput, setSearchInput] = useState(""); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // 1. DEBOUNCE SEARCH INPUT (Prevents server spam while typing)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Reset pagination to page 1 whenever any filter or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priorityFilter, goalFilter, activeTab]);

  const goals = useQuery(api.goals.getByUser, userId ? { userId } : "skip");

  const getGoalColor = (goalId: string) => goals?.find((g) => g._id === goalId)?.color || "#00d4ff";
  const getGoalTitle = (goalId: string) => goals?.find((g) => g._id === goalId)?.title || "Unknown Goal";

  // Get start of today safely for accurate backend querying
  const localTodayStart = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }, []);

  const paginationData = useQuery(api.tasks.getTasksPaginated, userId ? {
    userId,
    searchQuery,
    priorityFilter,
    goalFilter,
    activeTab,
    page: currentPage,
    limit: TASKS_PER_PAGE,
    localTodayStart
  } : "skip");

  // 2. STATE RETENTION (Prevents the UI from flashing a loading skeleton)
  const [cachedData, setCachedData] = useState<any>(null);
  useEffect(() => {
    if (paginationData) {
      setCachedData(paginationData);
    }
  }, [paginationData]);

  const handlePlanComplete = () => {
    setActiveTab("today"); // Auto-switch to "Today" tab after planning
  };

  // Only show the skeleton on the VERY FIRST load.
  if (!cachedData && !paginationData) {
    return <TasksPageSkeleton />;
  }
  if (!goals) return null;

  // Use new data if available, otherwise fall back to cached data to prevent layout shift
  const displayData = paginationData || cachedData;
  const isFetching = !paginationData && cachedData; // True if we are secretly loading new data in the background

  const { tasks: paginatedTasks, counts, totalPages, totalItems, currentPage: safePage } = displayData;
  const startIndex = (safePage - 1) * TASKS_PER_PAGE;

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            Tasks
          </h1>
          <p className="text-muted-foreground">
            Manage your daily tasks across all goals
          </p>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsPlanOpen(true)}
            className="flex items-center bg-[#19183B] rounded-3xl px-4 py-1.5 gap-2 shadow-[0_0_25px_rgba(147,197,253,0.7)] hover:scale-95 hover:shadow-[0_0_15px_rgba(147,197,253,0.35)] transition-all duration-400 "
          >
            <Image src="/pDay.png" alt="AI" width={26} height={26} className="animate-glow-pulse" />
            Plan My Day
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center bg-[#6499E9] text-black rounded-3xl px-4 py-1.5 gap-2  shadow-[0_0_15px_rgba(168,255,62,0.7)] hover:shadow-[0_0_25px_rgba(168,255,62,0.3)] hover:scale-95 transition-all duration-400"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Tabs & Filters Section */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="animate-slide-up"
        style={{ animationDelay: "0.15s" }}
      >
        {/* Controls Container: Horizontal on Large Screens, Vertical on Small */}
        <div className="flex flex-col-reverse lg:flex-row lg:items-center justify-between gap-4 mb-6">

          {/* Tabs List */}
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="all">All({counts.all})</TabsTrigger>
            <TabsTrigger value="today">Today({counts.today})</TabsTrigger>
            <TabsTrigger value="pending">Pending({counts.pending})</TabsTrigger>
            <TabsTrigger value="completed">Completed({counts.completed})</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 lg:w-auto w-full">
            <div className="relative flex-1 lg:w-64">
              {isFetching && searchInput.length > 0 ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              <Input
                placeholder="Search tasks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
            <div className="flex gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-39 bg-secondary/50 border-border">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={goalFilter} onValueChange={setGoalFilter}>
                <SelectTrigger className="w-40 bg-secondary/50 border-border">
                  <SelectValue placeholder="Goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Goals</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal._id} value={goal._id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        <TabsContent value={activeTab} className="mt-0">
          <div className={cn("transition-opacity duration-300", isFetching ? "opacity-60 pointer-events-none" : "opacity-100")}>
            {paginatedTasks && paginatedTasks.length > 0 ? (
              <div className="flex flex-col space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {paginatedTasks.map((task: any, index: number) => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      goalColor={getGoalColor(task.goalId)}
                      goalId={task.goalId}
                      goalTitle={getGoalTitle(task.goalId)}
                      showGoalInfo
                      style={{ animationDelay: `${index * 0.05}s` }}
                    />
                  ))}
                </div>

                {/* Server-Side Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2 border-t border-white/5 animate-fade-in">
                    <div className="text-xs text-muted-foreground font-mono">
                      Showing <span className="text-foreground">{startIndex + 1}-{Math.min(startIndex + TASKS_PER_PAGE, totalItems)}</span> of <span className="text-foreground">{totalItems}</span> tasks
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1 || isFetching}
                        className="border-white/10 bg-secondary/50 hover:bg-secondary h-8 px-3"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                      </Button>
                      
                      <div className="flex items-center gap-1 px-2 overflow-x-auto max-w-[200px] hide-scrollbar">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            disabled={isFetching}
                            className={cn(
                              "w-7 h-7 rounded-md text-xs font-mono font-medium transition-colors flex items-center justify-center shrink-0",
                              safePage === i + 1 
                                ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,100,255,0.3)]" 
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                            )}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages || isFetching}
                        className="border-white/10 bg-secondary/50 hover:bg-secondary h-8 px-3"
                      >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                  <CheckSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No tasks found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {activeTab === 'today'
                    ? "Your day is clear! Use 'Plan My Day' to fill it up."
                    : "Try adjusting your filters or create a new task."}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        userId={userId!}
      />

      {/* Plan Day Dialog */}
      {userId && (
        <PlanDayDialog
          userId={userId}
          isOpen={isPlanOpen}
          onOpenChange={setIsPlanOpen}
          onPlanComplete={handlePlanComplete}
        />
      )}
    </div>
  );
}