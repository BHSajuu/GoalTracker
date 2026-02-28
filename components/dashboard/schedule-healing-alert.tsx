"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, Clock, X, CalendarDays, Activity } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function ScheduleHealingAlert() {
  const { userId } = useAuth();
  const drift = useQuery(api.agent.getDriftMetrics, userId ? { userId } : "skip");
  const recover = useAction(api.agent.recoverSchedule);
  
  const [isHealing, setIsHealing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [statusText, setStatusText] = useState("Initializing AI Agent...");

  if (!userId) return null;

  // Cycling text effect during healing
  useEffect(() => {
    if (!isHealing) return;
    const phrases = [
      "Analyzing capacity...",
      "Parsing overdue tasks...",
      "Resolving time conflicts...",
      "Distributing workload...",
      "Finalizing timeline..."
    ];
    let i = 0;
    setStatusText(phrases[0]); // Immediate start
    
    const interval = setInterval(() => {
      i = (i + 1) % phrases.length;
      setStatusText(phrases[i]);
    }, 800); // Changes text every 800ms
    
    return () => clearInterval(interval);
  }, [isHealing]);

 const handleFix = async () => {
    setIsHealing(true);
    try {
      const result = await recover({ userId });
      
      if (result.success) {
        toast.success("Schedule Rebalanced", {
          description: result.message,
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
        });
      } else {
        // Handle the safe failure response from the backend
        toast.error("Optimization Incomplete", {
          description: result.message || "Please try running the agent again.",
        });
      }
    } catch (error) {
      // Fallback for actual network/server errors
      toast.error("System Error", {
        description: "An unexpected error occurred while communicating with the agent. Please try again."
      });
    } finally {
      setIsHealing(false); 
    }
  };

  const show = drift && drift.hasDrift && !isDismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background p-6 shadow-lg shadow-amber-500/5 min-h-[140px] flex flex-col justify-center">
            
            {/* Ambient Background Glow */}
            <div className={cn(
              "absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[60px] transition-colors duration-700",
              isHealing ? "bg-indigo-500/30" : "bg-amber-500/20"
            )} />
            
            {/*Dismiss Button */}
            {!isHealing && (
              <button 
                onClick={() => setIsDismissed(true)}
                className="absolute top-2 right-3 p-1.5 rounded-full hover:bg-amber-500/10 text-muted-foreground hover:text-foreground transition-colors z-20"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <AnimatePresence mode="wait">
              {!isHealing ? (
                // DEFAULT ALERT STATE
                <motion.div
                  key="alert-state"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center w-full"
                >
                  {/* Left Content */}
                  <div className="flex gap-4">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10",
                      drift.isCritical ? "animate-pulse" : ""
                    )}>
                      <Clock className="h-6 w-6 text-amber-500" />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        Schedule Overload Detected
                        {drift.isCritical && (
                          <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                            Critical
                          </span>
                        )}
                      </h3>
                      <p className="text-muted-foreground max-w-lg leading-relaxed">
                        You have <span className="text-foreground font-medium">{drift.overdueCount} overdue tasks</span> (~{Math.round(drift.driftMinutes / 60)}h). 
                        Let AI rebalance your load across the next 3 days to prevent burnout.
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={handleFix}
                    disabled={isHealing}
                    size="lg"
                    className="group relative w-full overflow-hidden bg-foreground text-background hover:bg-foreground/90 sm:w-auto font-medium transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Fix My Schedule
                    </div>
                  </Button>
                </motion.div>
              ) : (
                // HIGHLY ANIMATED AI REBALANCING STATE
                <motion.div
                  key="healing-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="relative flex flex-col items-center justify-center w-full py-1 gap-6"
                >
                  {/* MAIN HOLOGRAPHIC PIPELINE */}
                  <div className="relative w-full max-w-lg h-20 bg-black/40 rounded-2xl border border-indigo-500/30 overflow-hidden flex items-center justify-between px-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
                    
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px]" />

                    {/* Data Particle Stream (Flowing from left to right) */}
                    <div className="absolute inset-0 pointer-events-none z-0">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ left: "15%", opacity: 0, scale: 0.5 }}
                          animate={{ 
                            left: "85%", 
                            opacity: [0, 1, 1, 0], 
                            scale: [0.5, 1, 1, 0.5],
                            backgroundColor: ["#ef4444", "#f59e0b", "#4ade80", "#4ade80"] // Red -> Amber -> Green transition
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: "linear" }}
                          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]"
                        />
                      ))}
                    </div>

                    {/* Left Node: Chaos / Overdue */}
                    <div className="z-10 relative flex flex-col items-center justify-center gap-1 bg-background/50 p-2 rounded-xl border border-red-500/20 backdrop-blur-md">
                      <Clock className="w-6 h-6 text-red-400" />
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute inset-0 bg-red-500 rounded-xl blur-[8px] -z-10"
                      />
                    </div>

                    {/* Center Node: AI Processing Brain */}
                    <div className="z-10 relative flex items-center justify-center">
                      {/* Radar Sweep Effect */}
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute -inset-10 rounded-full opacity-30 blur-sm"
                        style={{ background: "conic-gradient(from 0deg, transparent 70%, #818cf8 100%)" }}
                      />
                      {/* Outer Rings */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute -inset-4 rounded-full border border-dashed border-indigo-400/50"
                      />
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="absolute -inset-2 rounded-full border-t-2 border-b-2 border-teal-400/60 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                      />
                      {/* Core Bot Icon */}
                     <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="  rounded-full  border border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.5)] backdrop-blur-sm"
                      >
                        <Image src="/ai4.png" alt="AI" width={45} height={45} />
                      </motion.div>
                    </div>

                    {/* Right Node: Harmony / Balanced Schedule */}
                    <div className="z-10 relative flex flex-col items-center justify-center gap-1 bg-background/50 p-2 rounded-xl border border-green-500/20 backdrop-blur-md">
                      <motion.div
                        animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <CalendarDays className="w-6 h-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Status Text & Progress */}
                  <div className="w-full max-w-lg space-y-3 z-10">
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-mono text-indigo-400 font-medium flex items-center gap-2">
                        <Activity className="w-3 h-3 animate-pulse" />
                        {statusText}
                      </span>
                      <span className="font-mono text-muted-foreground">{drift.overdueCount} tasks</span>
                    </div>
                    {/* Continuous loading bar */}
                    <div className="w-full h-1 bg-secondary/50 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                      />
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}