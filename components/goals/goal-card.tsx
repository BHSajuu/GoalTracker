"use client";

import React, { useState } from "react";
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
  goal: Doc<"goals"> & { imageUrl?: string };
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

  const hasImage = !!goal.imageUrl;

  return (
    <>
      <div
        className={cn(
          "rounded-2xl overflow-hidden group animate-scale-in shadow-lg hover:scale-105 transition-all duration-300 relative",
          hasImage ? "bg-black" : "glass-card bg-background/50"
        )}
        style={{
          ...style,
          boxShadow: isHovered
            ? `0 10px 40px -10px ${goal.color}66`
            : undefined,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* --- BACKGROUND IMAGE LAYER --- */}
        {hasImage && (
          <>
            <img
              src={goal.imageUrl}
              alt={goal.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-0 opacity-50"
            />
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 z-0 transition-opacity duration-300" />
          </>
        )}

        <div
          className="h-1 relative z-20"
          style={{
            background: `linear-gradient(90deg, ${goal.color}, ${goal.color}88)`,
          }}
        />

        {/* --- CONTENT LAYER --- */}
        <div className={cn("p-5 pt-3 relative z-10 flex flex-col h-full", hasImage && "text-white")}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <Link href={`/dashboard/goals/${goal._id}`}>
                <h3 
                  className={cn(
                    "font-semibold truncate text-lg transition-colors",
                    hasImage 
                      ? "text-white group-hover:text-primary-foreground/90" 
                      : "text-foreground group-hover:text-primary"
                  )}
                >
                  {goal.title}
                </h3>
              </Link>
              <span
                className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium backdrop-blur-md"
                style={{
                  backgroundColor: hasImage ? `${goal.color}40` : `${goal.color}20`,
                  color: hasImage ? '#fff' : goal.color,
                  border: hasImage ? `1px solid ${goal.color}80` : 'none'
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
                  className={cn(
                    "h-8 w-8 shrink-0 hover:bg-white/20",
                    hasImage 
                      ? "text-white/70 hover:text-white" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
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
            <p 
              className={cn(
                "text-sm line-clamp-2 mb-4 h-10",
                hasImage ? "text-zinc-200" : "text-muted-foreground"
              )}
            >
              {goal.description}
            </p>
          )}

          <div className="mb-4 mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-sm", hasImage ? "text-zinc-300" : "text-muted-foreground")}>
                Progress
              </span>
              <span className={cn("text-sm font-medium", hasImage ? "text-white" : "text-foreground")}>
                {goal.progress}%
              </span>
            </div>
            <Progress
              value={goal.progress}
              className={cn("h-1.5", hasImage ? "bg-white/20" : "")}
              indicatorColor={goal.color}
            />
          </div>

          <div className={cn(
            "flex items-center justify-between pt-4 border-t",
            hasImage ? "border-white/20" : "border-border/50"
          )}>
            <div className={cn("flex items-center gap-4 text-xs", hasImage ? "text-zinc-300" : "text-muted-foreground")}>
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
                "px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
                goal.status === "active" && (hasImage ? "bg-green-500/40 text-green-100" : "bg-green-500/20 text-green-400"),
                goal.status === "completed" && (hasImage ? "bg-primary/80 text-white" : "bg-primary/20 text-primary"),
                goal.status === "paused" && (hasImage ? "bg-yellow-500/40 text-yellow-100" : "bg-yellow-500/20 text-yellow-400")
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