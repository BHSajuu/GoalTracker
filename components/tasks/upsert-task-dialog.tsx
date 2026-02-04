"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckSquare, Target, Clock } from "lucide-react";
import { toast } from "sonner";

interface UpsertTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  mode: "create" | "edit";
  preselectedGoalId?: Id<"goals">;
  initialData?: {
    _id: Id<"tasks">;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    dueDate?: number;
    estimatedTime?: string;
    goalId?: Id<"goals">;
  };
}

export function UpsertTaskDialog({
  open,
  onOpenChange,
  userId,
  mode,
  preselectedGoalId,
  initialData,
}: UpsertTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalId, setGoalId] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const goals = useQuery(api.goals.getByUser, { userId });
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const updateGoalProgress = useMutation(api.goals.updateProgress);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || "");
        setPriority(initialData.priority);
        // Convert timestamp to YYYY-MM-DD for input
        setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "");
        setEstimatedTime(initialData.estimatedTime || "");
        setGoalId(initialData.goalId || "");
      } else if (mode === "create") {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
        setEstimatedTime("");
        setGoalId(preselectedGoalId || "");
      }
    }
  }, [open, mode, initialData, preselectedGoalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (mode === "create" && !goalId) return;

    setIsLoading(true);
    try {
      const commonData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        estimatedTime: estimatedTime.trim() || undefined,
      };

      if (mode === "create") {
        await createTask({
          userId,
          goalId: goalId as Id<"goals">,
          ...commonData,
        });
        await updateGoalProgress({ id: goalId as Id<"goals"> });
        toast.success("Task created successfully!");
      } else {
        if (!initialData?._id) return;
        await updateTask({
          id: initialData._id,
          ...commonData,
        });
        toast.success("Task updated successfully!");
      }

      onOpenChange(false);
    } catch {
      toast.error(`Failed to ${mode} task`);
    } finally {
      setIsLoading(false);
    }
  };

  const activeGoals = goals?.filter((g) => g.status === "active") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
              <CheckSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-foreground">
                {mode === "create" ? "Create New Task" : "Edit Task"}
              </DialogTitle>
              <DialogDescription>
                {mode === "create" ? "Add a task to help achieve your goal" : "Update task details"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="e.g., Complete Chapter 5 exercises"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary/50 border-border"
              required
            />
          </div>

          {/* Goal Selection (Disabled in Edit Mode) */}
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              {activeGoals.length === 0 ? (
                <div className="p-4 rounded-xl bg-secondary/30 text-center">
                  <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No active goals. Create a goal first.
                  </p>
                </div>
              ) : (
                <Select
                  value={goalId}
                  onValueChange={setGoalId}
                  disabled={!!preselectedGoalId}
                >
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGoals.map((goal) => (
                      <SelectItem key={goal._id} value={goal._id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: goal.color }}
                          />
                          {goal.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/50 border-border resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) =>
                  setPriority(v as "low" | "medium" | "high")
                }
              >
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      High
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>

            {/* Estimated Time (New Field) */}
            <div className="space-y-2 col-span-2 md:col-span-2">
               <Label htmlFor="estimatedTime" className="flex items-center gap-2">
                 <Clock className="w-3 h-3" /> Estimated Time
               </Label>
               <Input
                 id="estimatedTime"
                 placeholder="e.g., 2 hours, 30m"
                 value={estimatedTime}
                 onChange={(e) => setEstimatedTime(e.target.value)}
                 className="bg-secondary/50 border-border"
               />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || !title.trim() || (mode === "create" && !goalId)
              }
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                mode === "create" ? "Create Task" : "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}