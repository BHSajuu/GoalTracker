"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Zap, GraduationCap, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";

export interface AiPlan {
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

interface AiGoalGeneratorProps {
  isGenerating: boolean;
  generatedPlan: AiPlan | null;
  aiPrompt: string;
  handlePromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  needsTimeframe: boolean;
  timeframe: string;
  setTimeframe: (val: string) => void;
  aiMode: "fast" | "smart";
  setAiMode: (val: "fast" | "smart") => void;
}

export function AiGoalGenerator({
  isGenerating, generatedPlan, aiPrompt, handlePromptChange,
  needsTimeframe, timeframe, setTimeframe, aiMode, setAiMode
}: AiGoalGeneratorProps) {
  
  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      key="ai"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full"
    >
      {isGenerating ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6"
        >
          <div className="relative w-32 h-32 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t-2 border-r-2 border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-3 rounded-full border-b-2 border-l-2 border-teal-400/80 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="z-10 p-4 bg-background/80 backdrop-blur-md rounded-full border border-white/10"
            >
              <Image src="/ai2.png" alt="AI Architect" width={66} height={66} className="w-8 h-8 text-blue-400" />
            </motion.div>
            <motion.div
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent z-20 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 tracking-wide">
              Architecting Blueprint...
            </h3>
            <p className="text-xs text-muted-foreground animate-pulse">
              Decomposing goal into actionable milestones & timelines
            </p>
          </div>
        </motion.div>
      ) : !generatedPlan ? (
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
                placeholder="e.g. I want to learn Next.js and build a portfolio project..."
                value={aiPrompt}
                onChange={handlePromptChange}
                className="min-h-[100px] bg-secondary/30 border-white/10 resize-none text-base focus-visible:ring-blue-500/50 mb-2"
              />

              <AnimatePresence>
                {needsTimeframe && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="p-3 mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                        <CalendarClock className="w-4 h-4" />
                        No timeframe detected!
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When do you want to achieve this? You can specify a timeframe (e.g., "30 days", "by June"), or leave it blank to let the AI determine a realistic schedule.
                      </p>
                      <Input
                        placeholder="e.g., 30 days (Optional)"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="bg-background/50 border-amber-500/20 text-sm h-9"
                        autoFocus
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3 mt-2">
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
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-6"
        >
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
            <p className="mt-2 text-xs text-muted-foreground font-mono">
              Target: {generatedPlan.targetDate}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Action Plan ({generatedPlan.tasks.length} Steps)
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {generatedPlan.tasks.map((task, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-white/5">
                  <span className="text-xs text-muted-foreground">Day {task.dueDateOffset}</span>
                  <span className="text-sm">{task.title}</span>
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      )}
    </motion.div>
  );
}