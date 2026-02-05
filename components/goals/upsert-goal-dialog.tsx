"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
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
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";

interface UpsertGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  mode: "create" | "edit";
  initialData?: {
    _id: Id<"goals">;
    title: string;
    description?: string;
    category: string;
    targetDate?: number;
    color: string;
  };
}

const colorOptions = [
  "#00d4ff", "#7c3aed", "#10b981", "#f8bd56",
  "#ef4444", "#e07fb0", "#292cdb", "#155f57",
];

export function UpsertGoalDialog({
  open,
  onOpenChange,
  userId,
  mode,
  initialData,
}: UpsertGoalDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(colorOptions[0]);
  const [isLoading, setIsLoading] = useState(false);

  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || "");
        setCategory(initialData.category);
        setTargetDate(initialData.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : "");
        setColor(initialData.color);
      } else if (mode === "create") {
        setTitle("");
        setDescription("");
        setCategory("");
        setTargetDate("");
        setColor(colorOptions[0]);
      }
    }
  }, [open, mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim()) return;

    setIsLoading(true);
    try {
      const commonData = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim(),
        targetDate: targetDate ? new Date(targetDate).getTime() : undefined,
        color,
      };

      if (mode === "create") {
        await createGoal({
          userId,
          ...commonData,
        });
        toast.success("Goal created successfully!");
      } else {
        if (!initialData?._id) return;
        await updateGoal({
          id: initialData._id,
          ...commonData,
        });
        toast.success("Goal updated successfully!");
      }

      onOpenChange(false);
    } catch {
      toast.error(`Failed to ${mode} goal`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-foreground">
                {mode === "create" ? "Create New Goal" : "Edit Goal"}
              </DialogTitle>
              <DialogDescription>
                {mode === "create" ? "Define a new goal to track" : "Update goal details"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g., Master AI & Machine Learning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary/50 border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., AI & ML, Web Dev, Semester Exam"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-secondary/50 border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/50 border-border resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date (Optional)</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: c,
                  }}
                />
              ))}
            </div>
          </div>

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
              disabled={isLoading || !title.trim() || !category.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                mode === "create" ? "Create Goal" : "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}