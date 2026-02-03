"use client";

import React from "react"

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskItem } from "@/components/tasks/task-item";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Target,
  Edit2,
  Trash2,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { userId } = useAuth();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const goal = useQuery(
    api.goals.getById,
    resolvedParams.id ? { id: resolvedParams.id as Id<"goals"> } : "skip"
  );
  const tasks = useQuery(
    api.tasks.getByGoal,
    resolvedParams.id ? { goalId: resolvedParams.id as Id<"goals"> } : "skip"
  );

  const removeGoal = useMutation(api.goals.remove);

  const handleDelete = async () => {
    if (!goal) return;
    if (confirm("Are you sure you want to delete this goal and all its tasks?")) {
      await removeGoal({ id: goal._id });
      toast.success("Goal deleted");
      router.push("/dashboard/goals");
    }
  };

  if (goal === undefined || tasks === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Target className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Goal not found
        </h2>
        <Button onClick={() => router.push("/dashboard/goals")}>
          Back to Goals
        </Button>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const daysRemaining = goal.targetDate
    ? Math.ceil((goal.targetDate - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors animate-fade-in"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Goal Header */}
      <div
        className="glass-card rounded-2xl overflow-hidden animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div
          className="h-2"
          style={{
            background: `linear-gradient(90deg, ${goal.color}, ${goal.color}88)`,
          }}
        />
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${goal.color}20` }}
                >
                  <Target className="w-5 h-5" style={{ color: goal.color }} />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  {goal.title}
                </h1>
              </div>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${goal.color}20`,
                  color: goal.color,
                }}
              >
                {goal.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 bg-transparent"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>

          {goal.description && (
            <p className="text-muted-foreground mb-6">{goal.description}</p>
          )}

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Overall Progress
              </span>
              <span className="text-lg font-semibold text-foreground">
                {goal.progress}%
              </span>
            </div>
            <Progress
              value={goal.progress}
              className="h-3"
              style={
                {
                  "--primary": goal.color,
                } as React.CSSProperties
              }
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold text-foreground">
                {tasks.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/10">
              <p className="text-2xl font-bold text-green-500">
                {completedTasks}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/10">
              <p className="text-2xl font-bold text-yellow-500">
                {pendingTasks}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10">
              <p className="text-2xl font-bold text-primary">
                {daysRemaining !== null
                  ? daysRemaining > 0
                    ? daysRemaining
                    : daysRemaining === 0
                      ? "Today"
                      : "Overdue"
                  : "-"}
              </p>
              <p className="text-sm text-muted-foreground">
                {daysRemaining !== null && daysRemaining > 0
                  ? "Days Left"
                  : "Target"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div
        className="glass-card rounded-2xl p-6 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            Tasks
          </h2>
          <Button
            onClick={() => setIsTaskDialogOpen(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4">
              No tasks yet for this goal
            </p>
            <Button
              onClick={() => setIsTaskDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add your first task
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks
              .sort((a, b) => {
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1;
                }
                return b.createdAt - a.createdAt;
              })
              .map((task) => (
                <TaskItem
                  key={task._id}
                  task={task}
                  goalColor={goal.color}
                  goalId={goal._id}
                />
              ))}
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        userId={userId!}
        preselectedGoalId={goal._id}
      />
    </div>
  );
}
