"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  Pause,
  Play,
  CheckCircle,
  Calendar,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UpsertGoalDialog } from "./upsert-goal-dialog";

interface GoalCardProps {
  goal: Doc<"goals">;
  style?: React.CSSProperties;
}

export function GoalCard({ goal, style }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // OPTIMISTIC STATE
  const [optimisticGoal, setOptimisticGoal] = useState({
    status: goal.status,
    isDeleted: false,
  });

  useEffect(() => {
    setOptimisticGoal({
      status: goal.status,
      isDeleted: false,
    });
  }, [goal.status]);

  const updateGoal = useMutation(api.goals.update);
  const removeGoal = useMutation(api.goals.remove);

  const handleStatusChange = async (status: "active" | "completed" | "paused") => {
    //  Instant UI update
    const prevStatus = optimisticGoal.status;
    setOptimisticGoal((prev) => ({ ...prev, status }));

    try {
      //  Background Sync
      await updateGoal({ id: goal._id, userId: goal.userId, status });
      toast.success(`Goal ${status === "completed" ? "completed" : status}`);
    } catch (error) {
      //  Revert
      setOptimisticGoal((prev) => ({ ...prev, status: prevStatus }));
      toast.error("Failed to update goal status");
    }
  };

  const handleDelete = async () => {
    setOptimisticGoal((prev) => ({ ...prev, isDeleted: true })); 
    try {
      await removeGoal({ id: goal._id, userId: goal.userId });
      toast.success("Goal deleted");
    } catch (error) {
      setOptimisticGoal((prev) => ({ ...prev, isDeleted: false }));
      toast.error("Failed to delete goal");
    }
  };

  const daysRemaining = goal.targetDate
    ? Math.ceil((goal.targetDate - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Instantly remove from UI if deleted
  if (optimisticGoal.isDeleted) return null;

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden group animate-scale-in shadow-lg hover:scale-105 transition-all duration-300 relative glass-card bg-background/50"
        style={{
          ...style,
          boxShadow: isHovered ? `0 10px 40px -10px ${goal.color}66` : undefined,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="h-1 relative z-20"
          style={{
            background: `linear-gradient(90deg, ${goal.color}, ${goal.color}88)`,
          }}
        />

        {/* CONTENT LAYER */}
        <div className="p-5 pt-3 relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <Link href={`/dashboard/goals/${goal._id}`}>
                <h3 className="font-semibold truncate text-lg transition-colors text-foreground group-hover:text-primary">
                  {goal.title}
                </h3>
              </Link>
              <span
                className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium backdrop-blur-md"
                style={{
                  backgroundColor: `${goal.color}20`,
                  color: goal.color,
                }}
              >
                {goal.category}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 hover:bg-white/20 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer gap-2 focus:bg-primary/20"
                >
                  <Pencil className="w-4 h-4" /> Edit Goal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {optimisticGoal.status !== "completed" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("completed")}
                    className="cursor-pointer gap-2 focus:bg-primary/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {optimisticGoal.status === "active" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("paused")}
                    className="cursor-pointer gap-2 focus:bg-primary/20"
                  >
                    <Pause className="w-4 h-4" />
                    Pause Goal
                  </DropdownMenuItem>
                )}
                {optimisticGoal.status === "paused" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("active")}
                    className="cursor-pointer gap-2 focus:bg-primary/10"
                  >
                    <Play className="w-4 h-4" />
                    Resume Goal
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {goal.description && (
            <p className="text-sm line-clamp-2 mb-4 h-10 text-muted-foreground">
              {goal.description}
            </p>
          )}

          <div className="mb-4 mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Progress
              </span>
              <span className="text-sm font-medium text-foreground">
                {goal.progress}%
              </span>
            </div>
            <Progress
              value={goal.progress}
              className="h-1.5"
              indicatorColor={goal.color}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {goal.targetDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {daysRemaining !== null && daysRemaining > 0
                    ? `${daysRemaining}d left`
                    : daysRemaining === 0
                      ? "Due today"
                      : "Overdue"}
                </span>
              )}
            </div>
            <span
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-colors duration-300",
                optimisticGoal.status === "active" && "bg-green-500/20 text-green-400",
                optimisticGoal.status === "completed" && "bg-primary/20 text-primary",
                optimisticGoal.status === "paused" && "bg-yellow-500/20 text-yellow-400"
              )}
            >
              {optimisticGoal.status}
            </span>
          </div>
        </div>
      </div>

      <UpsertGoalDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        userId={goal.userId}
        mode="edit"
        initialData={goal}
      />
    </>
  );
}