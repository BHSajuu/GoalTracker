"use client";

import { useState, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Target, Sparkles, Bot, CheckCircle2,
  CalendarDays, LayoutTemplate, Palette, Zap, GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";

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

// AI Plan Interface 
interface AiPlan {
  title: string;
  description: string;
  category: string;
  color: string;
  targetDate: string;
  tasks: Array<{
    title: string;
    priority: "low" | "medium" | "high";
    estimatedTime: number;
    dueDateOffset: number;
  }>;
}

export function UpsertGoalDialog({
  open,
  onOpenChange,
  userId,
  mode,
  initialData,
}: UpsertGoalDialogProps) {
  //  Form States 
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(colorOptions[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");

  //  AI States 
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMode, setAiMode] = useState<"fast" | "smart">("fast"); // New State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<AiPlan | null>(null);

  //  Mutations & Actions 
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const createGoalWithTasks = useMutation(api.goals.createGoalWithTasks);
  const generatePlan = useAction(api.ai.generateGoalPlan);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || "");
        setCategory(initialData.category);
        // Convert timestamp to YYYY-MM-DD for input
        setTargetDate(initialData.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : "");
        setColor(initialData.color);
        setActiveTab("manual");
      } else if (mode === "create") {
        resetForm();
        setGeneratedPlan(null);
        setAiPrompt("");
        setAiMode("fast"); // Reset mode
        setActiveTab("ai");
      }
    }
  }, [open, mode, initialData]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setTargetDate("");
    setColor(colorOptions[0]);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
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
        await createGoal({ userId, ...commonData });
        toast.success("Goal created successfully!");
      } else {
        if (!initialData?._id) return;
        await updateGoal({ id: initialData._id, ...commonData });
        toast.success("Goal updated successfully!");
      }
      onOpenChange(false);
    } catch {
      toast.error(`Failed to ${mode} goal`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedPlan(null);

    try {
      // Updated to pass 'mode'
      const plan = await generatePlan({ prompt: aiPrompt, mode: aiMode });
      setGeneratedPlan(plan as AiPlan);
      toast.success("Plan generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAiPlan = async () => {
    if (!generatedPlan) return;
    setIsLoading(true);

    try {
      // Robust Date Parsing
      const dateParts = generatedPlan.targetDate.split("-");
      // Handle potential M-D-YYYY vs MM-DD-YYYY
      const month = parseInt(dateParts[0]) - 1;
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);

      const timestamp = new Date(year, month, day).getTime();

      await createGoalWithTasks({
        userId,
        title: generatedPlan.title,
        description: generatedPlan.description,
        category: generatedPlan.category,
        color: generatedPlan.color || colorOptions[0],
        targetDate: timestamp,
        tasks: generatedPlan.tasks,
      });
      toast.success("Goal and tasks created successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save the plan.");
    } finally {
      setIsLoading(false);
    }
  };

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl p-0 gap-0 overflow-hidden border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">

        {/* Header Section */}
        <div className="p-6 pb-2 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-2xl border shadow-inner transition-colors duration-500",
                  activeTab === "ai"
                    ? "bg-blue-600/10 text-blue-400 animate-glow-pulse"
                    : "bg-primary/10 text-primary animate-glow-pulse"
                )}
              >
                {activeTab === "ai" ? <Image src="/ai3.png" alt="AI" width={30} height={30} /> : <Image src="/goal.png" alt="Goal" width={30} height={30} />}
              </motion.div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {mode === "create" ? "Create New Goal" : "Edit Goal"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground/80">
                  {mode === "create"
                    ? "Draft your path to success using AI or manual entry."
                    : "Update your goal details and track your progress."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content Section */}
        <div className="p-6 pt-4 h-[65vh] md:h-auto md:max-h-[65vh] overflow-y-auto custom-scrollbar">
          {mode === "create" ? (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/50 p-1 rounded-xl">
                <TabsTrigger value="manual" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300">
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 transition-all duration-300">
                  <Bot className="w-4 h-4" />
                  AI Agent
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="manual" key="manual" className="mt-0 outline-none" asChild>
                  <motion.div
                    key="manual"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form id="manual-form" onSubmit={handleManualSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-muted-foreground" /> Goal Title</Label>
                        <Input
                          placeholder="e.g., Master AI & Machine Learning"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="h-11 bg-secondary/30 border-white/10 focus:border-primary/50 transition-colors"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Target className="w-4 h-4 text-muted-foreground" /> Category</Label>
                          <Input
                            placeholder="e.g., Web Dev"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="bg-secondary/30 border-white/10"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" /> Target Date</Label>
                          <Input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="bg-secondary/30 border-white/10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Describe your goal..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="bg-secondary/30 border-white/10 resize-none min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2"><Palette className="w-4 h-4 text-muted-foreground" /> Color Theme</Label>
                        <div className="flex flex-wrap gap-3">
                          {colorOptions.map((c) => (
                            <motion.button
                              key={c}
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setColor(c)}
                              className={cn(
                                "w-8 h-8 rounded-full shadow-sm transition-all border-2",
                                color === c ? "border-foreground ring-2 ring-offset-2 ring-offset-background" : "border-transparent opacity-70 hover:opacity-100"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </form>
                  </motion.div>
                </TabsContent>

                {/* AI TAB (Updated Color Theme)  */}
                <TabsContent value="ai" key="ai" className="mt-0 outline-none h-full" asChild>
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col h-full"
                  >
                    {!generatedPlan ? (
                      // Input State
                      <div className="flex flex-col gap-6 h-full justify-start pt-2">
                        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-blue-600/30 via-teal-500/20 to-indigo-600/30">
                          <div className="rounded-[15px] bg-background/95 backdrop-blur-xl p-6 relative overflow-hidden">
                            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 mb-2 flex items-center gap-2">
                              <Image src="/ai.png" alt="AI Architect" width={30} height={30} className="text-blue-400" />
                              AI Architect
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Describe your ambition. Our AI will decompose it into a structured, actionable roadmap with timelines and priorities.
                            </p>
                            <Textarea
                              placeholder="e.g. I want to learn Next.js and build a portfolio project in 2 weeks..."
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              className="min-h-[100px] bg-secondary/30 border-white/10 resize-none text-base focus-visible:ring-blue-500/50 mb-4"
                            />

                            {/* --- NEW MODEL SELECTOR --- */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              <div
                                onClick={() => setAiMode("fast")}
                                className={cn(
                                  "cursor-pointer p-3 rounded-xl border border-white/5 transition-all flex flex-col items-center text-center gap-2 hover:bg-secondary/30",
                                  aiMode === "fast"
                                    ? "bg-teal-500/10 border-teal-500/30 ring-1 ring-teal-500/30"
                                    : "bg-secondary/20"
                                )}
                              >
                                <Zap className={cn("w-5 h-5", aiMode === "fast" ? "text-teal-400" : "text-muted-foreground")} />
                                <div>
                                  <p className={cn("font-bold text-sm", aiMode === "fast" ? "text-teal-400" : "text-muted-foreground")}>Turbo</p>
                                  <p className="text-[10px] text-muted-foreground/70">Fast. Best for simple goals.</p>
                                </div>
                              </div>

                              <div
                                onClick={() => setAiMode("smart")}
                                className={cn(
                                  "cursor-pointer p-3 rounded-xl border border-white/5 transition-all flex flex-col items-center text-center gap-2 hover:bg-secondary/30",
                                  aiMode === "smart"
                                    ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/30"
                                    : "bg-secondary/20"
                                )}
                              >
                                <GraduationCap className={cn("w-5 h-5", aiMode === "smart" ? "text-indigo-400" : "text-muted-foreground")} />
                                <div>
                                  <p className={cn("font-bold text-sm", aiMode === "smart" ? "text-indigo-400" : "text-muted-foreground")}>Deep Think</p>
                                  <p className="text-[10px] text-muted-foreground/70">Reasoning. Best for complex plans.</p>
                                </div>
                              </div>
                            </div>
                            {/* ------------------------- */}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Review State
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-6"
                      >
                        {/* Plan Summary Card */}
                        <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-teal-500/5 to-transparent p-5">
                          <div className="flex items-start justify-between relative z-10">
                            <div className="space-y-1">
                              <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                                {generatedPlan.title}
                              </h3>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full border bg-opacity-10",
                                  aiMode === "fast" ? "bg-teal-500 text-teal-300 border-teal-500/20" : "bg-indigo-500 text-indigo-300 border-indigo-500/20"
                                )}>
                                  {aiMode === "fast" ? "Turbo" : "Deep Think"}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                  {generatedPlan.category}
                                </span>
                              </div>
                            </div>
                            <div
                              className="w-8 h-8 rounded-full shadow-lg ring-2 ring-white/10"
                              style={{ backgroundColor: generatedPlan.color }}
                            />
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                            {generatedPlan.description}
                          </p>
                          {/* Add Target Date Display */}
                          <p className="mt-2 text-xs text-muted-foreground font-mono">
                            Target: {generatedPlan.targetDate}
                          </p>

                          {/* Decorative blurry blobs */}
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl" />
                        </div>

                        {/* Tasks List */}
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            Action Plan ({generatedPlan.tasks.length} Steps)
                          </h4>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {generatedPlan.tasks.map((task, i) => (
                              <motion.div
                                key={i}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: i * 0.05 }} // Stagger effect
                                className="group flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-white/5 hover:bg-secondary/50 hover:border-blue-500/20 transition-all"
                              >
                                <div className={cn(
                                  "w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px]",
                                  task.priority === 'high' ? "bg-red-400 shadow-red-500/50" :
                                    task.priority === 'medium' ? "bg-amber-400 shadow-amber-500/50" : "bg-emerald-400 shadow-emerald-500/50"
                                )} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate group-hover:text-blue-200 transition-colors">
                                    {task.title}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap bg-background/50 px-2 py-1 rounded">
                                  Day {task.dueDateOffset}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          ) : (
            // Edit Mode - Fully Restored
            <form id="edit-form" onSubmit={handleManualSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-muted-foreground" /> Goal Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 bg-secondary/30 border-white/10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Target className="w-4 h-4 text-muted-foreground" /> Category</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-secondary/30 border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" /> Target Date</Label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="bg-secondary/30 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-secondary/30 border-white/10 resize-none min-h-[100px]"
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2"><Palette className="w-4 h-4 text-muted-foreground" /> Color Theme</Label>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((c) => (
                    <motion.button
                      key={c}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-8 h-8 rounded-full shadow-sm transition-all border-2",
                        color === c ? "border-foreground ring-2 ring-offset-2 ring-offset-background" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 mt-auto border-t border-white/5 flex justify-end gap-3 bg-background/50 backdrop-blur-sm">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading || isGenerating}>
            Cancel
          </Button>

          {mode === "create" && activeTab === "ai" ? (
            !generatedPlan ? (
              <Button
                onClick={handleGeneratePlan}
                disabled={isGenerating || !aiPrompt.trim()}
                className={cn(
                  "text-white shadow-lg transition-all",
                  aiMode === "fast"
                    ? "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 shadow-teal-500/20"
                    : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/20"
                )}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isGenerating ? "Architecting..." : "Generate Plan"}
              </Button>
            ) : (
              <Button
                onClick={handleConfirmAiPlan}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Confirm & Launch
              </Button>
            )
          ) : (
            <Button
              type="submit"
              form={mode === "create" ? "manual-form" : "edit-form"}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (mode === "create" ? "Create Goal" : "Save Changes")}
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}