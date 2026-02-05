"use client";

import React, { useState } from "react"
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
  
  const updateGoal = useMutation(api.goals.update);
  const removeGoal = useMutation(api.goals.remove);

  const handleStatusChange = async (
    status: "active" | "completed" | "paused"
  ) => {
    await updateGoal({ id: goal._id, status });
    toast.success(`Goal ${status === "completed" ? "completed" : status}`);
  };

  const handleDelete = async () => {
    await removeGoal({ id: goal._id });
    toast.success("Goal deleted");
  };

  const daysRemaining = goal.targetDate
    ? Math.ceil((goal.targetDate - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <div
        className="glass-card rounded-2xl overflow-hidden group animate-scale-in shadow-lg hover:scale-105 transition-all duration-300"
        style={{
          ...style,
          boxShadow: isHovered 
            ? `0 10px 40px -10px ${goal.color}66` 
            : undefined
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${goal.color}, ${goal.color}88)`,
          }}
        />

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <Link href={`/dashboard/goals/${goal._id}`}>
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {goal.title}
                </h3>
              </Link>
              <span
                className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-xs font-medium"
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
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* 1. Added focus:bg-primary/10 here */}
                <DropdownMenuItem 
                    onClick={() => setIsEditing(true)} 
                    className="cursor-pointer gap-2 focus:bg-primary/20"
                >
                  <Pencil className="w-4 h-4" /> Edit Goal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {goal.status !== "completed" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("completed")}
                    className="cursor-pointer gap-2 focus:bg-primary/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {goal.status === "active" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("paused")}
                    className="cursor-pointer gap-2 focus:bg-primary/20"
                  >
                    <Pause className="w-4 h-4" />
                    Pause Goal
                  </DropdownMenuItem>
                )}
                {goal.status === "paused" && (
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
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {goal.description}
            </p>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
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
                "px-2 py-1 rounded-full text-xs font-medium",
                goal.status === "active" && "bg-green-500/20 text-green-400",
                goal.status === "completed" && "bg-primary/20 text-primary",
                goal.status === "paused" && "bg-yellow-500/20 text-yellow-400"
              )}
            >
              {goal.status}
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