"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  CalendarDays, AlignLeft, AlertCircle, LayoutList, Wand2, Bot,
  Sparkles
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

const getTaskSchema = (mode: "create" | "edit") => z.object({
  title: z.string().min(1, "Task title is required").max(120, "Title is too long"),
  description: z.string().optional(),
  goalId: mode === "create" ? z.string().min(1, "Please select a related goal") : z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  estHours: z.string().optional(),
  estMinutes: z.string().optional(),
});

type TaskFormValues = z.infer<ReturnType<typeof getTaskSchema>>;

export function UpsertTaskDialog({
  open,
  onOpenChange,
  userId,
  mode,
  preselectedGoalId,
  initialData,
}: UpsertTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestingDesc, setIsSuggestingDesc] = useState(false);
  const [isSuggestionApplied, setIsSuggestionApplied] = useState(false);

  const goals = useQuery(api.goals.getByUser, { userId });
  const estimationMultiplier = useQuery(api.tasks.getEstimationMultiplier, { userId });
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const updateGoalProgress = useMutation(api.goals.updateProgress);
  const suggestDescription = useAction(api.ai.suggestDescription);
  const usage = useQuery(api.rateLimit.getUsage, { userId });
  
  const isRateLimited = usage !== undefined && usage >= 8;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(getTaskSchema(mode)),
    defaultValues: {
      title: "",
      description: "",
      goalId: preselectedGoalId || "",
      priority: "medium",
      dueDate: "",
      estHours: "",
      estMinutes: "",
    }
  });

  const currentTitle = form.watch("title");
  const currentGoalId = form.watch("goalId");
  const estHoursValue = form.watch("estHours");
  const estMinutesValue = form.watch("estMinutes");

  useEffect(() => {
    if (open) {
      setIsSuggestionApplied(false);
      form.clearErrors();
      
      if (mode === "edit" && initialData) {
        let h = "";
        let m = "";
        if (initialData.estimatedTime) {
          const hours = Math.floor(initialData.estimatedTime / 60);
          const minutes = initialData.estimatedTime % 60;
          h = hours > 0 ? hours.toString() : "";
          m = minutes > 0 ? minutes.toString() : "";
        }

        form.reset({
          title: initialData.title,
          description: initialData.description || "",
          priority: initialData.priority,
          dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "",
          goalId: initialData.goalId || "",
          estHours: h,
          estMinutes: m,
        });
      } else if (mode === "create") {
        form.reset({
          title: "",
          description: "",
          priority: "medium",
          dueDate: "",
          goalId: preselectedGoalId || "",
          estHours: "",
          estMinutes: "",
        });
      }
    }
  }, [open, mode, initialData, preselectedGoalId, form]);

  const handleSuggestDescription = async () => {
    if (isRateLimited) {
      window.dispatchEvent(new Event("show-rate-limit-dialog"));
      return;
    }

    if (!currentTitle?.trim()) {
      form.setError("title", { type: "manual", message: "Please enter a title first to use AI." });
      return;
    }

    const selectedGoal = goals?.find((g) => g._id === currentGoalId);

    setIsSuggestingDesc(true);
    try {
      const suggestion = await suggestDescription({
        userId,
        title: currentTitle.trim(),
        type: "task",
        goalTitle: selectedGoal?.title,
        goalDescription: selectedGoal?.description
      });
      form.setValue("description", suggestion, { shouldDirty: true, shouldValidate: true });
      toast.success("Task description auto-filled!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to suggest description.");
    } finally {
      setIsSuggestingDesc(false);
    }
  };

  const onSubmit = async (data: TaskFormValues) => {
    setIsLoading(true);
    try {
      const h = parseInt(data.estHours || "0", 10);
      const m = parseInt(data.estMinutes || "0", 10);
      const totalMinutes = (h * 60) + m;

      const commonData = {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate).getTime() : undefined,
        estimatedTime: totalMinutes > 0 ? totalMinutes : undefined,
      };

      if (mode === "create" && data.goalId) {
        await createTask({
          userId,
          goalId: data.goalId as Id<"goals">,
          ...commonData,
        });
        await updateGoalProgress({ id: data.goalId as Id<"goals">, userId });
        toast.success("Task created successfully!");
      } else {
        if (!initialData?._id) return;
        await updateTask({
          id: initialData._id,
          userId,
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

  // Safely parse the watched string values back to numbers for the math
  const currentTotalMinutes = 
    (parseInt(String(estHoursValue || "0"), 10) * 60) + 
    parseInt(String(estMinutesValue || "0"), 10);

  const showTimeSuggestion = estimationMultiplier !== undefined && estimationMultiplier > 1.01 && currentTotalMinutes > 0 && !isSuggestionApplied;
  
  const suggestedMinutes = showTimeSuggestion ? Math.round(currentTotalMinutes * estimationMultiplier) : 0;
  const suggestedH = Math.floor(suggestedMinutes / 60);
  const suggestedM = suggestedMinutes % 60;

  const applySuggestedTime = () => {
    form.setValue("estHours", suggestedH > 0 ? suggestedH.toString() : "", { shouldValidate: true, shouldDirty: true });
    form.setValue("estMinutes", suggestedM > 0 ? suggestedM.toString() : "", { shouldValidate: true, shouldDirty: true });
    setIsSuggestionApplied(true);
    toast.success("AI suggested time applied!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 max-h-[95vh] overflow-y-auto border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">

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

        <div className="p-6 pt-4 h-[60vh] md:h-auto overflow-y-auto custom-scrollbar">
          <form id="task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-foreground/90">
                <LayoutList className="w-4 h-4 text-muted-foreground" /> Task Title
              </Label>
              <Input
                placeholder="e.g., Complete Chapter 5 exercises"
                {...form.register("title")}
                className={cn(
                  "h-11 bg-secondary/30 border-white/10 transition-colors",
                  form.formState.errors.title ? "border-red-500 focus-visible:ring-red-500" : "focus:border-emerald-500/50"
                )}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-red-500 font-medium">{form.formState.errors.title.message}</p>
              )}
            </div>

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
                  <Controller
                    control={form.control}
                    name="goalId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!!preselectedGoalId}
                      >
                        <SelectTrigger className={cn(
                          "h-11 bg-secondary/30 border-white/10",
                          form.formState.errors.goalId && "border-red-500"
                        )}>
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
                  />
                )}
                {form.formState.errors.goalId && (
                  <p className="text-xs text-red-500 font-medium">{form.formState.errors.goalId.message}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground/90">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" /> Priority
                </Label>
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground/90">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" /> Due Date
                </Label>
                <Input
                  type="date"
                  {...form.register("dueDate")}
                  className="bg-secondary/30 border-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-foreground/90">
                <Clock className="w-4 h-4 text-muted-foreground" /> Estimated Duration
              </Label>
              <div className="grid grid-cols-2 gap-4 relative">
                
                {/* Fixed Hours Input using Controller */}
                <div className="relative">
                  <Controller
                    control={form.control}
                    name="estHours"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        placeholder="0"
                        onChange={(e) => {
                          field.onChange(e); // Notify RHF of the change
                          setIsSuggestionApplied(false); // Reset AI suggestion state
                        }}
                        className="bg-secondary/30 border-white/10 pr-12"
                      />
                    )}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none font-medium">
                    hours
                  </span>
                </div>
                
                {/* Fixed Minutes Input using Controller */}
                <div className="relative">
                  <Controller
                    control={form.control}
                    name="estMinutes"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="59"
                        placeholder="0"
                        onChange={(e) => {
                          field.onChange(e); // Notify RHF of the change
                          setIsSuggestionApplied(false); // Reset AI suggestion state
                        }}
                        className="bg-secondary/30 border-white/10 pr-12"
                      />
                    )}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none font-medium">
                    mins
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {showTimeSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="relative group flex items-center gap-3 p-3 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)] overflow-hidden">
                      
                      <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 z-0"
                      />
                      
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.3)] shrink-0">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }} 
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        >
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                        </motion.div>
                      </div>
                      
                      <div className="relative z-10 flex-1 text-xs text-indigo-200/90 leading-relaxed">
                        Historical bias detected (<span className="font-bold text-indigo-300">{estimationMultiplier}x</span>). 
                        AI suggests <span className="font-bold text-white bg-indigo-500/30 px-1.5 py-0.5 rounded-md border border-indigo-500/30 ml-1 shadow-inner whitespace-nowrap">{suggestedH > 0 ? `${suggestedH}h ` : ""}{suggestedM > 0 ? `${suggestedM}m` : ""}</span>
                      </div>
                      
                      <Button
                        type="button"
                        size="sm"
                        onClick={applySuggestedTime}
                        className="relative z-10 h-8 text-[11px] px-3 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)] border border-indigo-400/50 rounded-lg transition-all hover:scale-105"
                      >
                        Apply Fix
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-foreground/90">
                  <AlignLeft className="w-4 h-4 text-muted-foreground" /> Description
                </Label>

                <button
                  type="button"
                  onClick={handleSuggestDescription}
                  disabled={isSuggestingDesc || !currentTitle?.trim()}
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

              <div className="relative rounded-md overflow-hidden group">
                <Textarea
                  placeholder="Add details, sub-steps, or notes..."
                  {...form.register("description")}
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
            disabled={isLoading}
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