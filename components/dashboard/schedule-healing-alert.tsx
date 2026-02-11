"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ScheduleHealingAlert() {
  const { userId } = useAuth();
  const drift = useQuery(api.agent.getDriftMetrics, userId ? { userId } : "skip");
  const recover = useAction(api.agent.recoverSchedule);
  
  const [isHealing, setIsHealing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  if (!userId) return null;

  const handleFix = async () => {
    setIsHealing(true);
    try {
      const result = await recover({ userId });
      if (result.success) {
        toast.success("Schedule Rebalanced", {
          description: result.message,
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
        });
      }
    } catch (error) {
      toast.error("Optimization failed. Please try again.");
    } finally {
      setIsHealing(false);
    }
  };

  // Logic: Show if drift exists AND the user hasn't dismissed it yet
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
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 via-background to-background p-6 shadow-lg shadow-amber-500/5">
            
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/20 blur-[60px]" />
            
            {/*Dismiss Button */}
            <button 
              onClick={() => setIsDismissed(true)}
              className="absolute top-1 right-3 p-1.5 rounded-full hover:bg-amber-500/10 text-muted-foreground hover:text-foreground transition-colors z-20"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              
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
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                {isHealing ? (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    Optimizing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Fix My Schedule
                  </div>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}