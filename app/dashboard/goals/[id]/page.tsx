"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskItem } from "@/components/tasks/task-item";
import { UpsertGoalDialog } from "@/components/goals/upsert-goal-dialog"; // Added import
import {
  ArrowLeft,
  Plus,
  Calendar,
  Target,
  Trash2,
  ListTodo,
  Clock,
  Trophy,
  AlertCircle,
  Edit // Added Edit icon
} from "lucide-react";
import { toast } from "sonner";
import { GoalDetailSkeleton } from "@/components/goals/goal-detail-skeleton";

export default function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { userId } = useAuth();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Added state for Edit Dialog

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
    return <GoalDetailSkeleton />;
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Goal not found
        </h2>
        <p className="text-muted-foreground mb-6">This goal may have been deleted.</p>
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
    <div className="space-y-5 pb-20 lg:pb-8 max-w-400 mx-auto">
      {/* Dynamic Background Glow */}
      <div 
        className="fixed top-20 right-0 -z-10 w-125 h-125 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: goal.color }}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between animate-slide-up">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium">Back to Goals</span>
        </button>

        {/* Action Buttons: Edit and Delete */}
        <div className="flex items-center gap-2">
          <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
              className="border-primary/20 hover:bg-primary/10 transition-colors"
          >
              <Edit className="w-4 h-4 mr-2" />
              Edit Goal
          </Button>
          <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Goal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        
        {/* Left Column: Main Info & Tasks */}
        <div className="lg:col-span-2 space-y-5">
            
            {/* Header Card */}
            <div className="glass-card p-8 rounded-3xl border border-secondary/20 relative overflow-hidden group">
                {/* Decorative gradient line */}
                <div 
                    className="absolute top-0 left-0 w-full h-1.5 opacity-80"
                    style={{ background: `linear-gradient(90deg, ${goal.color}, ${goal.color}22)` }} 
                />
                
                <div className="flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col items-start gap-2">
                            <span
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs md:font-semibold tracking-wide"
                                style={{
                                    backgroundColor: `${goal.color}15`,
                                    color: goal.color,
                                    border: `1px solid ${goal.color}30`
                                }}
                            >
                                {goal.category}
                            </span>
                            <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">
                                {goal.title}
                            </h1>
                        </div>
                        <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                            style={{ backgroundColor: goal.color, boxShadow: `0 8px 30px -4px ${goal.color}66` }}
                        >
                            <Target className="w-7 h-7 text-white" />
                        </div>
                    </div>

                    {goal.description && (
                        <p className="text-xs md:text-md text-muted-foreground leading-relaxed max-w-2xl mt-2">
                            {goal.description}
                        </p>
                    )}

                    <div className="pt-1 mt-3 border-t border-border/40">
                        <div className="flex items-end justify-between mb-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Progress Tracker</p>
                                <p className="text-xl font-bold text-foreground">{goal.progress}%</p>
                            </div>
                            <span className="text-sm font-medium text-muted-foreground mb-1">
                                {completedTasks} of {tasks.length} tasks completed
                            </span>
                        </div>
                        <Progress
                            value={goal.progress}
                            className="h-2 rounded-full bg-secondary"
                            indicatorColor={goal.color}
                        />
                    </div>
                </div>
            </div>

            {/* Tasks Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <ListTodo className="w-5 h-5 text-primary" />
                        </div>
                        Tasks & Milestones
                    </h2>
                    <button
                        onClick={() => setIsTaskDialogOpen(true)}
                        className="flex items-center bg-[#6499E9] text-black rounded-3xl px-4 py-1.5 gap-2  shadow-[0_0_15px_rgba(168,255,62,0.7)] hover:shadow-[0_0_25px_rgba(168,255,62,0.3)] hover:scale-95 transition-all duration-400"
                    >
                        <Plus className="w-4 h-4" />
                        New Task
                    </button>
                </div>

                <div className="glass-card p-2 rounded-2xl border border-secondary/20 min-h-50">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mb-4 animate-pulse">
                                <ListTodo className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No tasks created yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                                Break down your goal into smaller, manageable tasks to start tracking progress.
                            </p>
                            <Button
                                onClick={() => setIsTaskDialogOpen(true)}
                                variant="outline"
                                className="border-primary/20 hover:bg-primary/5 hover:text-primary"
                            >
                                Create your first task
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 p-2">
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
                                        isHardDelete={true}
                                    />
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Stats Grid */}
        <div className="space-y-6">
            <h3 className="text-lg font-semibold px-2">Analytics</h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                {/* Total Tasks Card */}
                <div className="glass-card p-5 rounded-2xl border border-secondary/20 flex items-center gap-4 group hover:bg-secondary/40 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <ListTodo className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Total Tasks</p>
                        <p className="text-2xl font-bold">{tasks.length}</p>
                    </div>
                </div>

                {/* Completed Card */}
                <div className="glass-card p-5 rounded-2xl border border-secondary/20 flex items-center gap-4 group hover:bg-secondary/40 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Completed</p>
                        <p className="text-2xl font-bold">{completedTasks}</p>
                    </div>
                </div>

                {/* Pending Card */}
                <div className="glass-card p-5 rounded-2xl border border-secondary/20 flex items-center gap-4 group hover:bg-secondary/40 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Pending</p>
                        <p className="text-2xl font-bold">{pendingTasks}</p>
                    </div>
                </div>

                {/* Time Remaining Card */}
                <div className="glass-card p-5 rounded-2xl border border-secondary/20 flex items-center gap-4 group hover:bg-secondary/40 transition-colors relative overflow-hidden">
                    {/* Subtle progress background for time */}
                    <div 
                        className="absolute bottom-0 left-0 h-1 bg-primary/20" 
                        style={{ width: '100%' }}
                    />
                    
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">
                            {daysRemaining !== null && daysRemaining > 0
                                ? "Time Remaining"
                                : "Status"}
                        </p>
                        <p className="text-xl font-bold">
                            {daysRemaining !== null
                                ? daysRemaining > 0
                                    ? `${daysRemaining} Days`
                                    : daysRemaining === 0
                                        ? "Due Today"
                                        : "Overdue"
                                : "No Deadline"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Motivation Quote / Tip area (Optional placeholder for visual balance) */}
            <div className="glass-card p-6 rounded-2xl border border-dashed border-secondary/30 bg-secondary/5 mt-8">
                <p className="text-sm text-muted-foreground italic text-center">
                    "Small steps every day add up to big results. Keep pushing!"
                </p>
            </div>
        </div>

      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        userId={userId!}
        preselectedGoalId={goal._id}
      />

      {/* Edit Goal Dialog */}
      <UpsertGoalDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        userId={userId!}
        mode="edit"
        initialData={{
          _id: goal._id,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          targetDate: goal.targetDate,
          color: goal.color,
          imageUrl: goal.imageUrl,
        }}
      />
    </div>
  );
}