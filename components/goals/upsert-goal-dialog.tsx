"use client";

import { useState, useEffect } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useForm, FormProvider } from "react-hook-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Bot, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import { ManualGoalForm, colorOptions } from "./manual-goal-form";
import { AiGoalGenerator, AiPlan } from "./ai-goal-generator";

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

const goalSchema = z.object({
  title: z.string().min(1, "Goal title is required").max(100, "Title is too long"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  targetDate: z.string().optional(),
  color: z.string(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export function UpsertGoalDialog({
  open,
  onOpenChange,
  userId,
  mode,
  initialData,
}: UpsertGoalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMode, setAiMode] = useState<"fast" | "smart">("fast");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<AiPlan | null>(null);
  const [needsTimeframe, setNeedsTimeframe] = useState(false);
  const [timeframe, setTimeframe] = useState("");

  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const createGoalWithTasks = useMutation(api.goals.createGoalWithTasks);
  const generatePlan = useAction(api.ai.generateGoalPlan);
  const usage = useQuery(api.rateLimit.getUsage, { userId });
  
  const isRateLimited = usage !== undefined && usage >= 8;

  const methods = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      targetDate: "",
      color: colorOptions[0],
    }
  });

  useEffect(() => {
    if (open) {
      methods.clearErrors();
      if (mode === "edit" && initialData) {
        methods.reset({
          title: initialData.title,
          description: initialData.description || "",
          category: initialData.category,
          targetDate: initialData.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : "",
          color: initialData.color,
        });
        setActiveTab("manual");
      } else if (mode === "create") {
        methods.reset({
          title: "",
          description: "",
          category: "",
          targetDate: "",
          color: colorOptions[0],
        });
        setGeneratedPlan(null);
        setAiPrompt("");
        setAiMode("fast");
        setNeedsTimeframe(false);
        setTimeframe("");
        setActiveTab("ai");
      }
    }
  }, [open, mode, initialData, methods]);

  const onSubmit = async (data: GoalFormValues) => {
    setIsLoading(true);
    try {
      const commonData = {
        title: data.title.trim(),
        description: data.description?.trim(),
        category: data.category.trim(),
        targetDate: data.targetDate ? new Date(data.targetDate).getTime() : undefined,
        color: data.color,
      };

      if (mode === "create") {
        await createGoal({ userId, ...commonData });
        toast.success("Goal created successfully!");
      } else {
        if (!initialData?._id) return;
        await updateGoal({ id: initialData._id, userId, ...commonData });
        toast.success("Goal updated successfully!");
      }
      onOpenChange(false);
    } catch {
      toast.error(`Failed to ${mode} goal`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAiPrompt(e.target.value);
    if (needsTimeframe) setNeedsTimeframe(false); 
  };

  const handleGeneratePlan = async () => {
    if (isRateLimited) {
      window.dispatchEvent(new Event("show-rate-limit-dialog"));
      return;
    }
    
    if (!aiPrompt.trim()) return;

    const timeKeywords = /\b(day|days|week|weeks|month|months|year|years|date|by|tomorrow|target|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;

    if (!timeKeywords.test(aiPrompt) && !needsTimeframe) {
      setNeedsTimeframe(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedPlan(null);

    let finalPrompt = aiPrompt;
    if (needsTimeframe) {
      if (timeframe.trim()) {
        finalPrompt += `\nTarget Timeframe: ${timeframe.trim()}`;
      } else {
        finalPrompt += `\nTarget Timeframe: UNKNOWN. You MUST dynamically pick a realistic target date and timeframe based on the goal's complexity.`;
      }
    }

    try {
      const plan = await generatePlan({ userId, prompt: finalPrompt, mode: aiMode });
      setGeneratedPlan(plan as AiPlan);
      methods.setValue("title", plan.title);
      methods.setValue("description", plan.description);
      methods.setValue("category", plan.category);
      methods.setValue("color", plan.color);
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
      const dateParts = generatedPlan.targetDate.split("-");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl p-0 gap-0 overflow-hidden border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">

        {/*  Header Section */}
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

        <div className="p-6 pt-4 h-[65vh] md:h-auto md:max-h-[75vh] overflow-y-auto custom-scrollbar">
          {mode === "create" ? (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2  gap-2 lg:gap-20 mb-6 bg-secondary/50 p-1 lg:px-13  rounded-xl">
                <TabsTrigger value="manual" className="lg:w-55 rounded-lg data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:shadow-sm transition-all duration-300">
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="ai" className="lg:w-55 gap-2 rounded-lg data-[state=active]:!bg-background data-[state=active]:!text-foreground transition-all duration-300">
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
                    <FormProvider {...methods}>
                      <form id="manual-form" onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
                        <ManualGoalForm userId={userId} />
                      </form>
                    </FormProvider>
                  </motion.div>
                </TabsContent>

                <TabsContent value="ai" key="ai" className="mt-0 outline-none h-full" asChild>
                  <AiGoalGenerator
                    isGenerating={isGenerating}
                    generatedPlan={generatedPlan}
                    aiPrompt={aiPrompt}
                    handlePromptChange={handlePromptChange}
                    needsTimeframe={needsTimeframe}
                    timeframe={timeframe}
                    setTimeframe={setTimeframe}
                    aiMode={aiMode}
                    setAiMode={setAiMode}
                  />
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          ) : (
            <FormProvider {...methods}>
              <form id="edit-form" onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
                <ManualGoalForm userId={userId} />
              </form>
            </FormProvider>
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
                className={cn("text-white shadow-lg transition-all", aiMode === "fast" ? "bg-teal-600" : "bg-indigo-600")}
              >
                {isGenerating ? "Building..." : (needsTimeframe ? "Confirm & Generate" : "Generate Plan")}
              </Button>
            ) : (
              <Button
                onClick={handleConfirmAiPlan}
                disabled={isLoading}
                className="bg-emerald-600 text-white"
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