"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Timer, History, CheckCircle2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface FocusTimerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Doc<"tasks">;
}

export function FocusTimer({ isOpen, onOpenChange, task }: FocusTimerProps) {
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const saveSession = useMutation(api.tasks.saveFocusSession);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSessionSeconds(0);
      const estMinutes = task.estimatedTime || 0;
      const actualMinutes = task.actualTime || 0;
      setRemainingSeconds((estMinutes * 60) - (actualMinutes * 60));
      setStatus("idle");
    } else {
      stopTimer();
    }
  }, [isOpen, task]);

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

  const startTimer = () => setStatus("running");
  const pauseTimer = () => setStatus("paused");
  const stopTimer = () => {
    setStatus("idle");
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleFinishSession = async (markCompleted: boolean = false) => {
    const duration = Math.ceil(sessionSeconds / 60);
    if (duration <= 0 && sessionSeconds < 10 && !markCompleted) {
      onOpenChange(false);
      return;
    }
    setIsSaving(true);
    try {
      await saveSession({
        userId: task.userId,
        taskId: task._id,
        startTime: Date.now() - (sessionSeconds * 1000),
        endTime: Date.now(),
        duration,
        status: "completed",
      });
      toast.success(`Session saved (+${duration}m)`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const isNeg = totalSeconds < 0;
    const abs = Math.abs(totalSeconds);
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;

    const mDisplay = m.toString().padStart(2, "0");
    const sDisplay = s.toString().padStart(2, "0");

    if (h > 0) {
      return `${isNeg ? "+" : ""}${h}:${mDisplay}:${sDisplay}`;
    }
    return `${isNeg ? "+" : ""}${mDisplay}:${sDisplay}`;
  };

  const totalEstSeconds = (task.estimatedTime || 30) * 60;
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / totalEstSeconds) * 100));
  const isOvertime = remainingSeconds < 0;

  const timeString = formatTime(remainingSeconds);
  const hasHours = timeString.split(":").length > 2;


  const radius = 120;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && status === "running") {
          pauseTimer();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="w-[90vw] max-w-[420px] [&>button]:hidden p-0  overflow-hidden bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2rem] sm:rounded-[2.5rem]">

        <DialogTitle className="sr-only">Focus Timer</DialogTitle>
        <DialogDescription className="sr-only">
          Focus session for task: {task.title}
        </DialogDescription>

        {/* Header Section */}
        <div className="relative z-10 p-5 sm:p-6 flex items-start justify-between bg-gradient-to-b from-muted/50 to-transparent">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Focus Timer</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold leading-tight line-clamp-2">
              {task.title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 hover:bg-background/80 -mt-1 -mr-2"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 opacity-70" />
          </Button>
        </div>

        {/* Main Timer Area */}
        <div className="relative flex flex-col items-center justify-center py-4 sm:py-8">

          <div className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] flex items-center justify-center scale-90 sm:scale-100 transition-transform">
            <svg width="100%" height="100%" viewBox="0 0 260 260" className="transform -rotate-90">
              <circle
                cx="130" cy="130" r={normalizedRadius}
                className="stroke-muted/20"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <motion.circle
                cx="140" cy="130" r={normalizedRadius}
                className={cn(isOvertime ? "text-red-500" : "text-primary")}
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <motion.div
                key={remainingSeconds}
                initial={{ scale: 0.98, opacity: 0.9 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "font-mono font-bold tracking-tighter tabular-nums select-none transition-all duration-300",
                  hasHours ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl",
                  isOvertime ? "text-red-500" : "text-foreground"
                )}
              >
                {timeString}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                {status === "running" ? (
                  <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-medium bg-primary/10 text-primary border border-primary/20 animate-pulse">
                    Focusing...
                  </span>
                ) : status === "paused" ? (
                  <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                    Paused
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Ready to Start
                  </span>
                )}
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-2 w-full max-w-[240px] sm:max-w-[280px] mt-4 sm:mt-6 gap-6 sm:gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Session
              </span>
              <div className="flex items-center gap-1.5 text-foreground font-mono font-medium text-sm sm:text-base">
                <History className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                {formatTime(sessionSeconds)}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Total
              </span>
              <div className="flex items-center gap-1.5 text-foreground font-mono font-medium text-sm sm:text-base">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                {Math.floor(((task.actualTime || 0) * 60 + sessionSeconds) / 60)}m
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-muted/20 border-t border-border/50 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {status === "idle" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Button
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
                  onClick={startTimer}
                  disabled={isSaving}
                >
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Start Session
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={status === "running" ? "outline" : "default"}
                    disabled={isSaving}
                    className={cn(
                      "h-12 sm:h-12 text-sm sm:text-base font-medium rounded-xl transition-all",
                      status === "running" ? "border-primary/20 hover:bg-primary/5 hover:text-primary" : "shadow-md"
                    )}
                    onClick={status === "running" ? pauseTimer : startTimer}
                  >
                    {status === "running" ? (
                      <> <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Pause </>
                    ) : (
                      <> <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-current" /> Resume </>
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    disabled={isSaving}
                    className="h-12 sm:h-12 text-sm sm:text-base font-medium rounded-xl"
                    onClick={() => handleFinishSession(false)}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-current" />
                        Stop
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </DialogContent>
    </Dialog>
  );
}