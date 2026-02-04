"use client";

import React, { useState } from "react"
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
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UpsertTaskDialog } from "./upsert-task-dialog";

interface TaskItemProps {
  task: Doc<"tasks">;
  goalColor: string;
  goalId: Id<"goals">;
  goalTitle?: string;
  showGoalInfo?: boolean;
  style?: React.CSSProperties;
}

export function TaskItem({
  task,
  goalColor,
  goalId,
  goalTitle,
  showGoalInfo,
  style,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const toggleComplete = useMutation(api.tasks.toggleComplete);
  const updateGoalProgress = useMutation(api.goals.updateProgress);
  const removeTask = useMutation(api.tasks.remove);
  const updateTask = useMutation(api.tasks.update);

  const handleToggle = async () => {
    await toggleComplete({ id: task._id });
    await updateGoalProgress({ id: goalId });
  };

  const handleDelete = async () => {
    await removeTask({ id: task._id });
    await updateGoalProgress({ id: goalId });
    toast.success("Task deleted");
  };

  const handlePriorityChange = async (
    priority: "low" | "medium" | "high"
  ) => {
    await updateTask({ id: task._id, priority });
    toast.success("Priority updated");
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
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <>
      <div
        className={cn(
          "glass-card rounded-xl p-4 transition-all group animate-scale-in",
          task.completed && "opacity-60"
        )}
        style={style}
      >
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            className="mt-0.5 shrink-0 transition-transform hover:scale-110"
          >
            {task.completed ? (
              <CheckCircle2
                className="w-6 h-6"
                style={{ color: goalColor }}
              />
            ) : (
              <Circle
                className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors"
              />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium text-foreground",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2">
                    <Pencil className="w-4 h-4" /> Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handlePriorityChange("high")}
                    className="gap-2"
                  >
                    <Flag className="w-4 h-4 text-red-500" />
                    High Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handlePriorityChange("medium")}
                    className="gap-2"
                  >
                    <Flag className="w-4 h-4 text-yellow-500" />
                    Medium Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handlePriorityChange("low")}
                    className="gap-2"
                  >
                    <Flag className="w-4 h-4 text-green-500" />
                    Low Priority
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
              {showGoalInfo && goalTitle && (
                <span
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${goalColor}15`,
                    color: goalColor,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: goalColor }}
                  />
                  {goalTitle}
                </span>
              )}

              <span
                className={cn(
                  "px-2 py-1 rounded-full font-medium",
                  task.priority === "high" && "bg-red-500/15 text-red-400",
                  task.priority === "medium" &&
                  "bg-yellow-500/15 text-yellow-400",
                  task.priority === "low" && "bg-green-500/15 text-green-400"
                )}
              >
                {task.priority}
              </span>

              {task.dueDate && (
                <span
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full",
                    task.dueDate < Date.now() && !task.completed
                      ? "bg-red-500/15 text-red-400"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}

              {task.estimatedTime && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {task.estimatedTime}
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