"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { WeeklyProgressChart } from "@/components/analytics/weekly-progress-chart";
import { GoalDistributionChart } from "@/components/analytics/goal-distribution-chart";
import { CategoryBreakdownChart } from "@/components/analytics/category-breakdown-chart";
import { AnalyticsStatsCards } from "@/components/analytics/analytics-stats-cards";
import { EfficiencyChart } from "@/components/analytics/efficiency-chart";
import { TasksByPriorityChart } from "@/components/analytics/tasks-by-priority-chart";
import { GoalProgressChart } from "@/components/analytics/goal-progress-chart";
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, ChevronDown, RefreshCw, BrainCircuit, Activity, 
  FileText, CheckCircle2, Target, Calendar,
  Lightbulb, TrendingUp, Zap 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AIMarkdownComponents = {
  h3: ({ node, ...props }: any) => (
    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mt-6 mb-3 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-500" {...props}>
      <Sparkles className="w-4 h-4 text-indigo-500" />
      {props.children}
    </h3>
  ),
  p: ({ node, ...props }: any) => (
    <p className="mb-4 text-[14px] leading-relaxed text-foreground/80 font-normal hidden" {...props} /> 
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="space-y-3 mt-2 mb-4 list-none" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="flex items-start gap-3 bg-secondary/20 p-3.5 rounded-xl border border-white/5 transition-all duration-300 hover:bg-secondary/40 hover:translate-x-1 animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
      <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
      <span className="text-[14px] text-foreground/80 leading-relaxed" {...props} />
    </li>
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-indigo-200" {...props} />
  ),
};

export default function AnalyticsPage() {
  const { userId } = useAuth();
  const queryArgs = userId ? { userId } : "skip";

  const goals = useQuery(api.goals.getByUser, queryArgs);
  const tasks = useQuery(api.tasks.getByUser, queryArgs);
  const stats = useQuery(api.tasks.getStats, queryArgs);

  const generateInsights = useAction(api.ai.generateAnalyticsInsights);
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const isLoading = goals === undefined || tasks === undefined || stats === undefined;

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  const activeGoals = goals?.filter((g) => g.status === "active").length || 0;
  const completedGoals = goals?.filter((g) => g.status === "completed").length || 0;
  const avgProgress = goals && goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;
  const completionRate = tasks && tasks.length > 0
    ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)
    : 0;

  const highPriorityTasks = tasks?.filter(t => t.priority === "high") || [];
  const highPriorityCompleted = highPriorityTasks.filter(t => t.completed).length;
  const highPriorityRate = highPriorityTasks.length > 0
    ? Math.round((highPriorityCompleted / highPriorityTasks.length) * 100)
    : 0;

  const handleGenerateAIInsights = async () => {
    if (!goals || !tasks || !stats) return;
    setIsGenerating(true);
    setIsExpanded(true);

    try {
      const dataPayload = {
        overall_completion_rate: `${completionRate}%`,
        high_priority_completion_rate: `${highPriorityRate}% (Completed ${highPriorityCompleted} out of ${highPriorityTasks.length} High Priority tasks)`,
        total_active_goals: activeGoals,
        average_goal_progress: `${avgProgress}%`,
        daily_performance_last_7_days: stats.dailyData.slice(-7)
      };

      const result = await generateInsights({ statsData: JSON.stringify(dataPayload) });
      setInsights(result);
      toast.success("Intelligence mapped successfully!");
    } catch (error) {
      toast.error("Failed to generate AI insights.");
    } finally {
      setIsGenerating(false);
    }
  };

  const leftParticles = Array.from({ length: 14 }).map((_, i) => {
    const types = [
      { icon: CheckCircle2, color: "text-emerald-400", shadow: "drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" },
      { icon: Target, color: "text-rose-400", shadow: "drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]" },
      { icon: FileText, color: "text-blue-400", shadow: "drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" },
      { icon: Calendar, color: "text-amber-400", shadow: "drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" },
      { icon: Activity, color: "text-indigo-400", shadow: "drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" },
    ];
    const type = types[i % types.length];
    return {
      ...type,
      top: `${8 + (i * 23) % 84}%`,
      delay: (i * 0.3) % 2.5,
      duration: 1.8 + (i % 3) * 0.4,
    };
  });

  const rightNodes = [
    { icon: Lightbulb, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", fill: "bg-amber-400", line: "from-amber-500/50", top: "12%", rightClass: "right-1 sm:right-4 md:right-[8%]", delay: 0.5 },
    { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", fill: "bg-emerald-400", line: "from-emerald-500/50", top: "45%", rightClass: "right-4 sm:right-8 md:right-[22%]", delay: 1.2 },
    { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", fill: "bg-yellow-400", line: "from-yellow-500/50", top: "75%", rightClass: "right-2 sm:right-6 md:right-[10%]", delay: 1.8 },
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-8 animate-in fade-in duration-500 overflow-x-hidden w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-glow flex items-center gap-3">
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your progress and performance metrics.
          </p>
        </div>

        {!insights && !isGenerating && (
          <button
            onClick={handleGenerateAIInsights}
            className="flex items-center bg-[#19183B] text-white rounded-3xl mr-3 px-4 py-1.5 gap-2 shadow-[0_0_25px_rgba(147,197,253,0.7)] hover:scale-95 hover:shadow-[0_0_15px_rgba(147,197,253,0.35)] transition-all duration-400"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Ask AI for Insights
          </button>
        )}
      </div>

      <AnimatePresence>
        {(isGenerating || insights) && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-indigo-500/30 bg-black/20 backdrop-blur-md shadow-[0_0_30px_rgba(79,70,229,0.1)]">
              <div className="p-5 flex flex-col gap-2">
                <div
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => !isGenerating && setIsExpanded(!isExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center">
                      {isGenerating ? (
                         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}>
                           <Activity className="w-5 h-5 text-indigo-400" />
                         </motion.div>
                      ) : (
                        <BrainCircuit className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-bold tracking-wide text-indigo-100">
                        AI Performance Analysis
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {insights && !isGenerating && (
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleGenerateAIInsights(); }} className="h-8 w-8 text-muted-foreground hover:text-indigo-300 rounded-full">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    {!isGenerating && (
                      <div className="p-1.5 rounded-full text-muted-foreground transition-colors">
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-2 border-t border-indigo-500/10">
                        <AnimatePresence mode="wait">
                          {isGenerating? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="relative overflow-hidden rounded-xl border border-indigo-500/20 bg-black/40 w-full shadow-inner"
                            >
                              <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden flex items-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent">
                                
                                {/* 1. Data Ingestion Stream (Left Side) */}
                                <div className="absolute left-0 top-0 bottom-0 w-1/3 z-10 pointer-events-none">
                                  {leftParticles.map((particle, i) => {
                                    const Icon = particle.icon;
                                    return (
                                      <motion.div
                                        key={`left-p-${i}`}
                                        className={`absolute ${particle.color} ${particle.shadow}`}
                                        style={{ top: particle.top }}
                                        initial={{ x: "-50px", scale: 0.6, opacity: 0 }}
                                        animate={{ 
                                          x: ["0px", "calc(150vw / 3)"], 
                                          y: ["0px", `calc(50% - ${particle.top})`],
                                          scale: [0.6, 0.2], 
                                          opacity: [0, 1, 0] 
                                        }}
                                        transition={{ 
                                          duration: particle.duration, 
                                          repeat: Infinity, 
                                          delay: particle.delay, 
                                          ease: "circIn" 
                                        }}
                                      >
                                        <Icon className="w-4 h-4 sm:w-6 sm:h-6 md:w-10 md:h-10" />
                                      </motion.div>
                                    );
                                  })}
                                  
                                  <div className="absolute inset-y-0 right-0 left-[-20%] flex flex-col justify-evenly opacity-20">
                                      {[...Array(6)].map((_, i) => (
                                          <div key={`track-${i}`} className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                                      ))}
                                  </div>
                                </div>

                                {/* Horizontal Core Beam */}
                                <div className="absolute inset-x-0 h-px bg-indigo-500/10 top-1/2 -translate-y-1/2 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                                   <motion.div 
                                      className="h-full w-1/4 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                                      animate={{ x: ["-100%", "400%"] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                   />
                                </div>

                                {/* 2. Neural Core (Center) - Aggressively scaled down on small screens */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
                                  <motion.div 
                                    className="absolute w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 rounded-full border-[1px] border-indigo-500/30 border-t-indigo-300 border-b-purple-400"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                  />
                                  <motion.div 
                                    className="absolute w-16 h-16 sm:w-24 sm:h-24 md:w-36 md:h-36 rounded-full border-[2px] border-indigo-500/10 border-l-indigo-400 border-r-indigo-300"
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                  />
                                  
                                  <motion.div 
                                    className="absolute w-12 h-12 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full bg-indigo-500/20 blur-2xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                  />
                                  
                                  <div className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full bg-black/50 border border-indigo-400/50 backdrop-blur-sm shadow-[0_0_30px_rgba(99,102,241,0.4)] overflow-hidden flex items-center justify-center">
                                    <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-indigo-300 z-10 drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                                    <motion.div 
                                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-400/30 blur-md"
                                      animate={{ scale: [0.8, 1.5, 0.8] }}
                                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                  </div>
                                </div>

                                {/* 3. Insight Data Cards Forming (Right Side) */}
                                <div className="absolute right-0 top-0 bottom-0 w-1/2 z-10 pointer-events-none">
                                  {rightNodes.map((node, i) => (
                                    <motion.div
                                      key={`right-node-${i}`}
                                      className={`absolute flex items-center gap-1.5 md:gap-3 p-1.5 md:p-3 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md shadow-xl ${node.rightClass}`}
                                      style={{ top: node.top }}
                                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                      animate={{ opacity: 1, x: 0, scale: 1 }}
                                      transition={{ duration: 0.6, delay: node.delay, ease: "easeOut" }}
                                    >
                                       <motion.div
                                         className={`absolute right-[calc(100%-5px)] md:right-[calc(100%-10px)] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r ${node.line} to-transparent opacity-60 z-[-1] w-12 sm:w-24 md:w-[200px]`}
                                         initial={{ scaleX: 0, transformOrigin: "right" }}
                                         animate={{ scaleX: 1 }}
                                         transition={{ duration: 0.8, delay: node.delay - 0.2 }}
                                       />

                                       <div className={`p-1 md:p-2 rounded-lg ${node.bg} ${node.border} border relative overflow-hidden shrink-0`}>
                                          <motion.div
                                            className="absolute inset-0 bg-white/20"
                                            animate={{ y: ["100%", "-100%"] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: node.delay }}
                                          />
                                          <node.icon className={`w-3 h-3 md:w-4 md:h-4 ${node.color} relative z-10`} />
                                       </div>

                                       <div className="flex flex-col gap-1 md:gap-1.5 w-16 sm:w-20 md:w-28">
                                          <div className="h-1 md:h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                             <motion.div
                                               className={`h-full ${node.fill} shadow-[0_0_10px_currentColor]`}
                                               initial={{ width: "0%" }}
                                               animate={{ width: ["0%", "100%", "75%"] }}
                                               transition={{ duration: 2.5, delay: node.delay + 0.5, ease: "circOut" }}
                                             />
                                          </div>
                                          <div className="flex gap-1.5">
                                             <div className="h-1 w-1/3 bg-white/10 rounded-full" />
                                             <div className="h-1 w-1/2 bg-white/5 rounded-full" />
                                          </div>
                                       </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="content"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4 }}
                              className="px-2 pb-2"
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={AIMarkdownComponents}
                              >
                                {insights || ""}
                              </ReactMarkdown>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnalyticsStatsCards
        activeGoals={activeGoals}
        completedGoals={completedGoals}
        avgProgress={avgProgress}
        completionRate={completionRate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[350px] min-w-0">
          <WeeklyProgressChart data={stats.dailyData} />
        </div>
        <div className="lg:mt-5 col-span-1 md:col-span-2 lg:col-span-3 min-h-[350px] min-w-0">
          <TasksByPriorityChart tasks={tasks || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[400px] min-w-0">
          {userId && <EfficiencyChart userId={userId} />}
        </div>
        <div className="lg:mt-18 col-span-1 md:col-span-2 lg:col-span-3 min-h-[400px] min-w-0">
          <CategoryBreakdownChart goals={goals || []} tasks={tasks || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        <div className="col-span-1 md:col-span-1 lg:col-span-3 min-h-[350px] min-w-0">
          <GoalDistributionChart goals={goals || []} />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-4 min-h-[350px] min-w-0">
          <GoalProgressChart goals={goals || []} />
        </div>
      </div>
    </div>
  );
}