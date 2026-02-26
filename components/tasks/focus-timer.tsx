"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Play, Pause, Square, Timer, History, CheckCircle2,
  X, Loader2, Maximize2, Minimize2, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// CONTEXT DEFINITION 
interface FocusTimerContextType {
  activeTask: Doc<"tasks"> | null;
  startFocusSession: (task: Doc<"tasks">) => void;
}

const FocusTimerContext = createContext<FocusTimerContextType | null>(null);

export const useFocusTimer = () => {
  const context = useContext(FocusTimerContext);
  if (!context) throw new Error("useFocusTimer must be used within a FocusTimerProvider");
  return context;
};

// PROVIDER COMPONENT 
export function FocusTimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTask, setActiveTask] = useState<Doc<"tasks"> | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [isMaximized, setIsMaximized] = useState(false);

  const saveSession = useMutation(api.tasks.saveFocusSession);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Interval Logic
  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => {
        setSessionSeconds((p) => p + 1);
        setRemainingSeconds((p) => p - 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status]);

  // Actions
  const startFocusSession = (task: Doc<"tasks">) => {
    if (activeTask) {
      if (activeTask._id !== task._id) {
        toast.warning(`Please finish or stop the timer for "${activeTask.title}" first.`);
        return;
      }
      setIsMaximized(true);
      return;
    }

    setActiveTask(task);
    setSessionSeconds(0);
    const estMinutes = task.estimatedTime || 0;
    const actualMinutes = task.actualTime || 0;
    setRemainingSeconds((estMinutes * 60) - (actualMinutes * 60));
    setStatus("idle");
    setIsMaximized(true);
  };

  const startTimer = () => setStatus("running");
  const pauseTimer = () => setStatus("paused");
  const stopTimer = () => {
    setStatus("idle");
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const discardSession = () => {
    stopTimer();
    setActiveTask(null);
    setIsMaximized(false);
  };

  const handleFinishSession = async (markCompleted: boolean = false) => {
    if (!activeTask) return;
    const duration = Math.ceil(sessionSeconds / 60);

    if (duration <= 0 && sessionSeconds < 10 && !markCompleted) {
      discardSession();
      return;
    }

    setIsSaving(true);
    try {
      await saveSession({
        userId: activeTask.userId,
        taskId: activeTask._id,
        startTime: Date.now() - (sessionSeconds * 1000),
        endTime: Date.now(),
        duration,
        status: "completed",
      });
      toast.success(`Session saved (+${duration}m)`);
      discardSession();
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  // Formatting
  const formatTime = (totalSeconds: number) => {
    const isNeg = totalSeconds < 0;
    const abs = Math.abs(totalSeconds);
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    const mDisplay = m.toString().padStart(2, "0");
    const sDisplay = s.toString().padStart(2, "0");
    if (h > 0) return `${isNeg ? "+" : ""}${h}:${mDisplay}:${sDisplay}`;
    return `${isNeg ? "+" : ""}${mDisplay}:${sDisplay}`;
  };

  const timeString = formatTime(remainingSeconds);
  const isOvertime = remainingSeconds < 0;
  const hasHours = timeString.split(":").length > 2;
  const totalEstSeconds = (activeTask?.estimatedTime || 30) * 60;
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / totalEstSeconds) * 100));

  const radius = 120;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <FocusTimerContext.Provider value={{ activeTask, startFocusSession }}>
      {children}

      {/* MINIMIZED FLOATING WIDGET (Premium UI) */}
      <AnimatePresence>
        {activeTask && !isMaximized && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed  bottom-19 left-16 lg:bottom-26 lg:left-4 z-50 w-55 bg-background/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl p-5 flex flex-col gap-4 group overflow-hidden"
          >
            {/* Widget Progress Bar (Bottom Edge) */}
            <div className="absolute bottom-0 left-0 h-1 bg-primary/10 w-full">
              <motion.div
                className={cn("h-full", isOvertime ? "bg-red-500" : "bg-primary")}
                animate={{ width: `${100 - progressPercent}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <div className={cn(
                  "p-1.5 rounded-full",
                  status === "running" ? "bg-primary/20 text-primary animate-pulse" : "bg-secondary text-muted-foreground"
                )}>
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[4px] uppercase tracking-wider text-muted-foreground">Focusing</span>
                  <span className="text-sm font-semibold truncate max-w-[90px]">{activeTask.title}</span>
                </div>
              </div>
              <div className=" flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIsMaximized(true)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors" title="Maximize">
                  <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={discardSession} className="p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors" title="Cancel Session">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex  pl-5 justify-between items-end relative z-10">
              <span className={cn(
                "text-4xl font-mono font-black tracking-tighter tabular-nums leading-none",
                isOvertime ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "text-foreground"
              )}>
                {timeString}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-10 mt-1 relative z-10">
              <Button size="sm" variant={status === "running" ? "outline" : "default"} onClick={status === "running" ? pauseTimer : startTimer} className="h-6 w-24 rounded-xl text-xs font-semibold shadow-sm">
                {status === "running" ? <Pause className="w-3.5 h-3.5 " /> : <Play className="w-3.5 h-3.5  fill-current" />}
                {status === "running" ? "Pause" : "Resume"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleFinishSession(false)} disabled={isSaving} className="h-6 w-20 rounded-xl text-xs font-semibold shadow-sm hover:bg-emerald-500 hover:text-white transition-colors">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Save
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAXIMIZED DIALOG (Premium UI) */}
      <Dialog open={activeTask !== null && isMaximized} onOpenChange={(open) => { if (!open) setIsMaximized(false); }}>
        {activeTask && (
          <DialogContent className="w-[95vw]  max-w-[440px] lg:h-[90vh] [&>button]:hidden p-0 overflow-hidden bg-background/70 backdrop-blur-3xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.2)] rounded-[2.5rem]">
            <DialogTitle className="sr-only">Focus Timer</DialogTitle>
            <DialogDescription className="sr-only">Focus session for task: {activeTask.title}</DialogDescription>

            {/* Glowing Background Orbs */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

            {/* Header Section */}
            <div className="relative z-10 p-6 flex items-start justify-between border-b border-white/5">
              <div className="space-y-1.5 pr-4">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", status === "running" ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-muted-foreground")} />
                  <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Focus Mode
                  </span>
                </div>
                <h2 className="text-xl font-bold leading-tight line-clamp-2 text-foreground/90">
                  {activeTask.title}
                </h2>
              </div>

              {/* Updated Top Right Actions */}
              <div className="flex items-center gap-1.5 -mt-2 -mr-2">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-secondary/30 hover:bg-secondary transition-colors" onClick={() => setIsMaximized(false)} title="Minimize to Corner">
                  <Minimize2 className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-secondary/30 hover:bg-destructive/20 hover:text-destructive transition-colors text-muted-foreground" onClick={discardSession} title="Cancel Session & Close">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Main Timer Area */}
            <div className="relative flex flex-col items-center justify-center py-0">
              <div className="relative w-[280px] h-[280px] flex items-center justify-center">

                {/* SVG Ring with Glow */}
                <svg width="100%" height="100%" viewBox="0 0 260 260" className="transform -rotate-90 drop-shadow-2xl">
                  <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Background Track */}
                  <circle cx="130" cy="130" r={normalizedRadius} className="stroke-muted/10" strokeWidth={strokeWidth} fill="none" />

                  {/* Progress Track */}
                  <motion.circle
                    cx="130" cy="130" r={normalizedRadius}
                    className={cn(isOvertime ? "text-red-500" : "text-primary")}
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "linear" }}
                    filter={status === "running" ? "url(#glow)" : ""}
                  />
                </svg>

                {/* Inner Timer Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <motion.div key={remainingSeconds} initial={{ scale: 0.95, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} className={cn("font-mono font-black tracking-tighter tabular-nums select-none", hasHours ? "text-5xl" : "text-6xl", isOvertime ? "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "text-foreground drop-shadow-md")}>
                    {timeString}
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                    {status === "running" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest animate-pulse">Running</span>
                    ) : status === "paused" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-widest">Paused</span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary text-muted-foreground uppercase tracking-widest">Ready</span>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 w-full max-w-[280px] mt-8 gap-4">
                <div className="flex flex-col items-center bg-secondary/30 rounded-2xl p-3 border border-white/5">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Session</span>
                  <div className="flex items-center gap-1.5 text-foreground font-mono font-semibold text-lg">
                    <History className="w-4 h-4 text-primary" />
                    {formatTime(sessionSeconds)}
                  </div>
                </div>
                <div className="flex flex-col items-center bg-secondary/30 rounded-2xl p-3 border border-white/5">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Total Time</span>
                  <div className="flex items-center gap-1.5 text-foreground font-mono font-semibold text-lg">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    {Math.floor(((activeTask.actualTime || 0) * 60 + sessionSeconds) / 60)}m
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-secondary/10 border-t border-white/5">
              <AnimatePresence mode="wait">
                {status === "idle" ? (
                  <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Button className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all" onClick={startTimer} disabled={isSaving}>
                      <Play className="w-5 h-5 mr-2 fill-current" />
                      Start Focus Session
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-3">
                    {/* Pause / Resume Button */}
                    <Button variant={status === "running" ? "outline" : "default"} disabled={isSaving} className={cn("h-14 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1", status === "running" ? "border-primary/20 bg-transparent hover:bg-primary/5 text-primary" : "bg-primary text-primary-foreground shadow-lg shadow-primary/20")} onClick={status === "running" ? pauseTimer : startTimer}>
                      {status === "running" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                      <span className="text-[10px] uppercase font-bold tracking-wider">{status === "running" ? "Pause" : "Resume"}</span>
                    </Button>

                    {/* Save / Finish Button */}
                    <Button disabled={isSaving} className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex flex-col items-center justify-center gap-1" onClick={() => handleFinishSession(false)}>
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      <span className="text-[10px] uppercase font-bold tracking-wider">Save</span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </FocusTimerContext.Provider>
  );
} 