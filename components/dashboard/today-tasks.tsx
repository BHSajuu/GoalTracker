
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface TodayTasksProps {
  userId: Id<"users">;
}

export function TodayTasks({ userId }: TodayTasksProps) {
 
  // Calculate local start and end of day to prevent UTC timezone mismatch bugs
  const { startOfDay, endOfDay } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return { startOfDay: start, endOfDay: end };
  }, []);

  const todayTasks = useQuery(api.tasks.getTodayTasks, { 
    userId, 
    startOfDay, 
    endOfDay 
  });
  
  const goals = useQuery(api.goals.getByUser, { userId });
  const toggleComplete = useMutation(api.tasks.toggleComplete);

  const handleToggle = async (taskId: Id<"tasks">) => {
    await toggleComplete({ id: taskId, userId });
  };

  const getGoalColor = (goalId: Id<"goals">) => {
    const goal = goals?.find((g) => g._id === goalId);
    return goal?.color || "#00d4ff";
  };

  const getGoalTitle = (goalId: Id<"goals">) => {
    const goal = goals?.find((g) => g._id === goalId);
    return goal?.title || "Unknown Goal";
  };

  return (
    <div
      className="glass-card rounded-2xl p-6 animate-slide-up"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Today&apos;s Tasks
        </h2>
        <Link
          href="/dashboard/tasks"
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {!todayTasks || todayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">No tasks for today</p>
          <Link href="/dashboard/tasks?new=true">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add a task
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {todayTasks.slice(0, 3).map((task) => (
            <div
              key={task._id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl bg-secondary/30 transition-all group",
                task.completed && "opacity-60"
              )}
            >
              <button
                onClick={() => handleToggle(task._id)}
                className="mt-0.5 shrink-0"
              >
                {task.completed ? (
                  <CheckCircle2
                    className="w-5 h-5 text-green-500"
                    style={{ color: getGoalColor(task.goalId) }}
                  />
                ) : (
                  <Circle
                    className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors"
                    style={{
                      borderColor: getGoalColor(task.goalId),
                    }}
                  />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-foreground",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getGoalColor(task.goalId) }}
                  />
                  {getGoalTitle(task.goalId)}
                </p>
              </div>
              <span
                className={cn(
                  "text-xs px-2 py-1 rounded-full shrink-0",
                  task.priority === "high" &&
                    "bg-red-500/20 text-red-400",
                  task.priority === "medium" &&
                    "bg-yellow-500/20 text-yellow-400",
                  task.priority === "low" &&
                    "bg-green-500/20 text-green-400"
                )}
              >
                {task.priority}
              </span>
            </div>
          ))}
          
          {todayTasks.length > 3 && (
            <Link
              href="/dashboard/tasks"
              className="block text-center text-sm text-primary hover:text-primary/80 py-2 transition-colors"
            >
              +{todayTasks.length - 3} more tasks
            </Link>
          )}
        </div>
      )}
    </div>
  );
}