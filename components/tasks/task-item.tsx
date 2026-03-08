"use client";

import React, { useState, useEffect } from "react"
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Trash2,
  Calendar,
  Flag,
  Clock,
  Pencil,
  Archive,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UpsertTaskDialog } from "./upsert-task-dialog";
import Image from "next/image";
import { useFocusTimer } from "./focus-timer";

interface TaskItemProps {
  task: Doc<"tasks">;
  goalColor: string;
  goalId: Id<"goals">;
  goalTitle?: string;
  showGoalInfo?: boolean;
  style?: React.CSSProperties;
  isHardDelete?: boolean;
}

export function TaskItem({
  task,
  goalColor,
  goalId,
  goalTitle,
  showGoalInfo,
  style,
  isHardDelete = false,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  // OPTIMISTIC STATE
  const [optimisticTask, setOptimisticTask] = useState({
    completed: task.completed,
    isArchived: task.isArchived,
    priority: task.priority,
    isDeleted: false, // Used to instantly hide on permanent delete
  });

  // Sync local state with database state when data arrives
  useEffect(() => {
    setOptimisticTask({
      completed: task.completed,
      isArchived: task.isArchived,
      priority: task.priority,
      isDeleted: false,
    });
  }, [task.completed, task.isArchived, task.priority]);

  const { startFocusSession } = useFocusTimer();

  const toggleComplete = useMutation(api.tasks.toggleComplete);
  const updateGoalProgress = useMutation(api.goals.updateProgress);
  const removeTask = useMutation(api.tasks.remove);
  const archiveTask = useMutation(api.tasks.archive);
  const unarchiveTask = useMutation(api.tasks.unarchive);
  const updateTask = useMutation(api.tasks.update);

  const handleToggle = async () => {
    //  Instantly update UI
    const newCompletedState = !optimisticTask.completed;
    setOptimisticTask((prev) => ({ ...prev, completed: newCompletedState }));

    //  Sync in background
    try {
      await toggleComplete({ id: task._id, userId: task.userId });
      await updateGoalProgress({ id: goalId, userId: task.userId });
    } catch (error) {
      //  Revert on failure
      setOptimisticTask((prev) => ({ ...prev, completed: !newCompletedState }));
      toast.error("Network error: Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (isHardDelete || optimisticTask.isArchived) {
      setOptimisticTask((prev) => ({ ...prev, isDeleted: true })); // Instantly hide
      try {
        await removeTask({ id: task._id, userId: task.userId });
        await updateGoalProgress({ id: goalId, userId: task.userId });
        toast.success("Task permanently deleted");
      } catch (error) {
        setOptimisticTask((prev) => ({ ...prev, isDeleted: false }));
        toast.error("Failed to delete task");
      }
    } else {
      setOptimisticTask((prev) => ({ ...prev, isArchived: true })); // Instantly visually archive
      try {
        await archiveTask({ id: task._id, userId: task.userId });
        await updateGoalProgress({ id: goalId, userId: task.userId });
        toast.success("Task removed successfully");
      } catch (error) {
        setOptimisticTask((prev) => ({ ...prev, isArchived: false }));
        toast.error("Failed to remove task");
      }
    }
  };

  const handleRestore = async () => {
    setOptimisticTask((prev) => ({ ...prev, isArchived: false }));
    try {
      await unarchiveTask({ id: task._id, userId: task.userId });
      await updateGoalProgress({ id: goalId, userId: task.userId });
      toast.success("Task restored to active list");
    } catch (error) {
      setOptimisticTask((prev) => ({ ...prev, isArchived: true }));
      toast.error("Failed to restore task");
    }
  };

  const handlePriorityChange = async (priority: "low" | "medium" | "high") => {
    const prevPriority = optimisticTask.priority;
    setOptimisticTask((prev) => ({ ...prev, priority }));
    try {
      await updateTask({ id: task._id, userId: task.userId, priority });
      toast.success("Priority updated");
    } catch (error) {
      setOptimisticTask((prev) => ({ ...prev, priority: prevPriority }));
      toast.error("Failed to update priority");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (timestamp < today.getTime()) {
      return "Overdue";
    } else if (timestamp < tomorrow.getTime()) {
      return "Today";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  // If hard deleted optimistically, completely hide the component instantly
  if (optimisticTask.isDeleted) return null;

  return (
    <>
      <div
        className={cn(
          "glass-card rounded-xl p-4 transition-all shadow-lg hover:shadow-blue-300/30 hover:scale-102 duration-400 ease-in-out",
          optimisticTask.completed && "opacity-60",
          optimisticTask.isArchived && "opacity-40 grayscale"
        )}
        style={style}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={handleToggle}
            disabled={optimisticTask.isArchived}
            className="mt-0.5 shrink-0 transition-transform hover:scale-110 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {optimisticTask.completed ? (
              <CheckCircle2 className="w-6 h-6" style={{ color: optimisticTask.isArchived ? "gray" : goalColor }} />
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium text-foreground transition-all duration-200",
                    optimisticTask.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                  {optimisticTask.isArchived && (
                    <span className="ml-2 text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground no-underline">
                      Archived
                    </span>
                  )}
                </p>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!optimisticTask.completed && !optimisticTask.isArchived && (
                  <Image
                    src="/timer2.png"
                    alt="Focus"
                    width={30}
                    height={20}
                    onClick={() => startFocusSession(task)}
                    className="w-7 md:w-8 cursor-pointer hover:scale-110 transition-transform"
                  />
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 transition-opacity text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {!optimisticTask.isArchived ? (
                      <>
                        <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2">
                          <Pencil className="w-4 h-4" /> Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handlePriorityChange("high")} className="gap-2">
                          <Flag className="w-4 h-4 text-red-500" /> High Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePriorityChange("medium")} className="gap-2">
                          <Flag className="w-4 h-4 text-yellow-500" /> Medium Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePriorityChange("low")} className="gap-2">
                          <Flag className="w-4 h-4 text-green-500" /> Low Priority
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={handleRestore} className="gap-2 text-primary focus:text-primary">
                          <RotateCcw className="w-4 h-4" /> Restore Active
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive">
                      {isHardDelete || optimisticTask.isArchived ? (
                        <><Trash2 className="w-4 h-4" /> Delete Permanently</>
                      ) : (
                        <><Archive className="w-4 h-4" /> Delete Task</>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
              {showGoalInfo && goalTitle && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: `${goalColor}15`, color: goalColor }}>
                  {goalTitle}
                </span>
              )}

              <span className={cn(
                "px-2 py-1 rounded-full font-medium transition-colors",
                optimisticTask.priority === "high" && "bg-red-500/15 text-red-400",
                optimisticTask.priority === "medium" && "bg-yellow-500/15 text-yellow-400",
                optimisticTask.priority === "low" && "bg-green-500/15 text-green-400"
              )}>
                {optimisticTask.priority}
              </span>

              {task.dueDate && (
                <span className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full",
                  task.dueDate < Date.now() && !optimisticTask.completed ? "bg-red-500/15 text-red-400" : "bg-secondary text-muted-foreground"
                )}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}

              {task.estimatedTime !== undefined && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Est: {formatDuration(task.estimatedTime)}
                </span>
              )}

              {task.actualTime !== undefined && task.actualTime > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                  <Clock className="w-3 h-3" />
                  Actual: {formatDuration(task.actualTime)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpsertTaskDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        userId={task.userId}
        mode="edit"
        initialData={task}
      />
    </>
  );
}