"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
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
import {
  Loader2, CheckSquare, Target, Clock,
  CalendarDays, AlignLeft, AlertCircle, LayoutList, Wand2, Bot
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    estimatedTime?: number;
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
  //  States 
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalId, setGoalId] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");

  const [estHours, setEstHours] = useState("");
  const [estMinutes, setEstMinutes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestingDesc, setIsSuggestingDesc] = useState(false);

  //  Data & Mutations 
  const goals = useQuery(api.goals.getByUser, { userId });
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const updateGoalProgress = useMutation(api.goals.updateProgress);
  const suggestDescription = useAction(api.ai.suggestDescription); 

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || "");
        setPriority(initialData.priority);
        setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "");
        setGoalId(initialData.goalId || "");

        // Convert stored minutes back to H:M
        if (initialData.estimatedTime) {
          const h = Math.floor(initialData.estimatedTime / 60);
          const m = initialData.estimatedTime % 60;
          setEstHours(h > 0 ? h.toString() : "");
          setEstMinutes(m > 0 ? m.toString() : "");
        } else {
          setEstHours("");
          setEstMinutes("");
        }

      } else if (mode === "create") {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
        setEstHours("");
        setEstMinutes("");
        setGoalId(preselectedGoalId || "");
      }
    }
  }, [open, mode, initialData, preselectedGoalId]);

const handleSuggestDescription = async () => {
    if (!title.trim()) {
      toast.error("Please enter a Task Title first.");
      return;
    }

    const selectedGoal = goals?.find((g) => g._id === goalId);

    setIsSuggestingDesc(true);
    try {
      const suggestion = await suggestDescription({ 
        title: title.trim(), 
        type: "task",
        goalTitle: selectedGoal?.title,
        goalDescription: selectedGoal?.description 
      });
      setDescription(suggestion);
      toast.success("Task description auto-filled!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to suggest description.");
    } finally {
      setIsSuggestingDesc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (mode === "create" && !goalId) return;

    setIsLoading(true);
    try {
      // Calculate total minutes
      const h = parseInt(estHours) || 0;
      const m = parseInt(estMinutes) || 0;
      const totalMinutes = (h * 60) + m;

      const commonData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        estimatedTime: totalMinutes > 0 ? totalMinutes : undefined,
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
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">

        {/* Header Section */}
        <div className="p-6 pb-4 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner"
              >
                <CheckSquare className="w-6 h-6" />
              </motion.div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {mode === "create" ? "Create New Task" : "Edit Task"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground/80">
                  {mode === "create" ? "Add a specific action item to your goal." : "Update your task details and timeline."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Form Section */}
        <div className="p-6 pt-4 h-[60vh] md:h-auto overflow-y-auto custom-scrollbar">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-foreground/90">
                <LayoutList className="w-4 h-4 text-muted-foreground" /> Task Title
              </Label>
              <Input
                placeholder="e.g., Complete Chapter 5 exercises"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 bg-secondary/30 border-white/10 focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>

            {/* Goal Selection (Only for Create Mode) */}
            {mode === "create" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground/90">
                  <Target className="w-4 h-4 text-muted-foreground" /> Related Goal
                </Label>
                {activeGoals.length === 0 ? (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-200">
                      No active goals found. Please create a goal first.
                    </p>
                  </div>
                ) : (
                  <Select
                    value={goalId}
                    onValueChange={setGoalId}
                    disabled={!!preselectedGoalId}
                  >
                    <SelectTrigger className="h-11 bg-secondary/30 border-white/10">
                      <SelectValue placeholder="Select a goal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeGoals.map((goal) => (
                        <SelectItem key={goal._id} value={goal._id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shadow-[0_0_8px]"
                              style={{
                                backgroundColor: goal.color,
                                boxShadow: `0 0 8px ${goal.color}`
                              }}
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

            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground/90">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" /> Priority
                </Label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    setPriority(v as "low" | "medium" | "high")
                  }
                >
                  <SelectTrigger className="bg-secondary/30 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2 text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2 text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]" />
                        High
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground/90">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" /> Due Date
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-secondary/30 border-white/10"
                />
              </div>
            </div>

            {/* Estimated Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-foreground/90">
                <Clock className="w-4 h-4 text-muted-foreground" /> Estimated Duration
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={estHours}
                    onChange={(e) => setEstHours(e.target.value)}
                    className="bg-secondary/30 border-white/10 pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none font-medium">
                    hours
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={estMinutes}
                    onChange={(e) => setEstMinutes(e.target.value)}
                    className="bg-secondary/30 border-white/10 pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none font-medium">
                    mins
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-foreground/90">
                  <AlignLeft className="w-4 h-4 text-muted-foreground" /> Description
                </Label>

                {/* Animated Auto-Fill Button */}
                <button
                  onClick={handleSuggestDescription}
                  disabled={isSuggestingDesc || !title.trim()}
                  className={cn(
                    "h-7 text-xs px-3 rounded-full transition-all duration-300 relative overflow-hidden group",
                    isSuggestingDesc
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-transparent hover:border-blue-500/20"
                  )}
                >
                  {!isSuggestingDesc && (
                    <motion.div
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 1 }}
                      className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0"
                    />
                  )}

                  <div className="flex items-center gap-1.5 relative z-10">
                    {isSuggestingDesc ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                    )}
                    {isSuggestingDesc ? "Synthesizing..." : "AI Auto-fill"}
                  </div>
                </button>
              </div>

              {/* Textarea with Holographic AI Overlay */}
              <div className="relative rounded-md overflow-hidden group">
                <Textarea
                  placeholder="Add details, sub-steps, or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSuggestingDesc}
                  className={cn(
                    "bg-secondary/30 border-white/10 resize-none min-h-[100px] transition-all duration-300",
                    isSuggestingDesc && "opacity-30 blur-[2px]"
                  )}
                />

                <AnimatePresence>
                  {isSuggestingDesc && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[1px] border border-blue-500/30 rounded-md"
                    >
                      <motion.div
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_rgba(59,130,246,1)] z-20"
                      />

                      <div className="flex flex-col items-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="p-2 bg-blue-500/20 rounded-full border border-blue-500/40"
                        >
                          <Bot className="w-5 h-5 text-blue-400" />
                        </motion.div>
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="text-[10px] font-bold tracking-widest text-blue-400 uppercase bg-background/80 px-2 py-0.5 rounded-full"
                        >
                          Writing
                        </motion.span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 mt-auto border-t border-white/5 flex justify-end gap-3 bg-background/50 backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="task-form"
            disabled={
              isLoading || !title.trim() || (mode === "create" && !goalId)
            }
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                {mode === "create" ? "Create Task" : "Save Changes"}
              </>
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}