"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { TaskItem } from "@/components/tasks/task-item";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { PlanDayDialog } from "@/components/tasks/plan-day-dialog";
import { Input } from "@/components/ui/input";
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
  Filter
} from "lucide-react";
import Image from "next/image";

export default function TasksPage() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  const tasks = useQuery(api.tasks.getByUser, userId ? { userId } : "skip");
  const goals = useQuery(api.goals.getByUser, userId ? { userId } : "skip");

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const getGoalColor = (goalId: string) => goals?.find((g) => g._id === goalId)?.color || "#00d4ff";
  const getGoalTitle = (goalId: string) => goals?.find((g) => g._id === goalId)?.title || "Unknown Goal";

  // Filtering Logic
  // 1. First, create a "Base" list that applies only the global filters (Search, Priority, Goal)
  // This list will be used to calculate the counts for the tabs
  const baseFilteredTasks = tasks?.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesGoal = goalFilter === "all" || task.goalId === goalFilter;
    return matchesSearch && matchesPriority && matchesGoal;
  }) || [];

  // 2. Calculate dynamic counts based on the global filters
  const allCount = baseFilteredTasks.length;
  const pendingCount = baseFilteredTasks.filter((t) => !t.completed).length;
  const completedCount = baseFilteredTasks.filter((t) => t.completed).length;

  const todayCount = baseFilteredTasks.filter((task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return task.dueDate >= today.getTime() && task.dueDate < tomorrow.getTime();
  }).length;

  // 3. Now apply the specific "Tab" filter for the final display list
  const filteredTasks = baseFilteredTasks.filter((task) => {
    if (activeTab === "pending") return !task.completed;
    if (activeTab === "completed") return task.completed;
    if (activeTab === "today") {
      if (!task.dueDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return task.dueDate >= today.getTime() && task.dueDate < tomorrow.getTime();
    }
    return true; // 'all' tab
  });

  const sortedTasks = filteredTasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
  });

  const handlePlanComplete = () => {
    setActiveTab("today"); // Auto-switch to "Today" tab after planning
  };

  if (!tasks || !goals) {
    return <TasksPageSkeleton />;
  }


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
            <TabsTrigger value="all">All({allCount})</TabsTrigger>
            <TabsTrigger value="today">
              Today({todayCount})
            </TabsTrigger>
            <TabsTrigger value="pending">Pending({pendingCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed({completedCount})</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 lg:w-auto w-full">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          {sortedTasks && sortedTasks.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sortedTasks.map((task, index) => (
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