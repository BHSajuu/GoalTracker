"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, AlertTriangle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export function RateLimitAlert({ userId }: { userId: Id<"users"> }) {
  const usage = useQuery(api.rateLimit.getUsage, { userId });
  const [isOpen, setIsOpen] = useState(false);
  const MAX_LIMIT = 8;

  // Keep track of the previous usage value to detect when it increments
  const prevUsageRef = useRef<number | undefined>(undefined);

  // Handle automatic popups
  useEffect(() => {
    if (usage === undefined) return;

    //The user just triggered an AI action and the count went up
    if (prevUsageRef.current !== undefined && usage > prevUsageRef.current) {
      if (usage >= 5 && usage <= MAX_LIMIT) {
        setIsOpen(true);
      }
    }    

    // Update the ref to the current usage
    prevUsageRef.current = usage;
  }, [usage]);

  // Handle manual triggers (When user tries to access AI while locked)
  useEffect(() => {
    const handleForceOpen = () => setIsOpen(true);
    window.addEventListener("show-rate-limit-dialog", handleForceOpen);
    return () => window.removeEventListener("show-rate-limit-dialog", handleForceOpen);
  }, []);

  if (usage === undefined) return null;

  const isLocked = usage >= MAX_LIMIT;
  const progressPercent = Math.min((usage / MAX_LIMIT) * 100, 100);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-border/40 bg-background/90 backdrop-blur-xl z-[999999]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`p-4 rounded-full ${isLocked ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}
            >
              {isLocked ? <ShieldAlert className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
            </motion.div>
          </div>
          <DialogTitle className="text-center text-xl">
            {isLocked ? "Daily AI Limit Reached" : "AI Usage Warning"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLocked
              ? "You've used all your AI requests for today. Please wait until tomorrow to use AI features again."
              : "You are approaching your daily limit for AI assistance. Use your remaining requests wisely!"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> AI Tasks Used
            </span>
            <span>{usage} / {MAX_LIMIT}</span>
          </div>
          <Progress
            value={progressPercent}
            className="h-2 bg-secondary"
            indicatorColor={isLocked ? "#ef4444" : "#f59e0b"}
          />
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={() => setIsOpen(false)} variant={isLocked ? "destructive" : "default"} className="w-full">
            {isLocked ? "Understood" : "Got it, I'll be careful"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}