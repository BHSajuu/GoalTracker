"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface FocusTimerDialogProps {
  taskId: Id<"tasks">;
  userId: Id<"users">; // New Prop
  taskTitle: string;
  estimatedTime?: string; // New Prop
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_DURATION = 25 * 60; // 25 minutes default

export function FocusTimerDialog({
  taskId,
  userId,
  taskTitle,
  estimatedTime,
  isOpen,
  onOpenChange,
}: FocusTimerDialogProps) {
  // Parse duration helper
  const parseDuration = (timeStr?: string): number => {
    if (!timeStr) return DEFAULT_DURATION;
    
    const str = timeStr.toLowerCase().trim();
    
    // Try to find numbers
    const match = str.match(/^(\d+(\.\d+)?)/);
    if (!match) return DEFAULT_DURATION;
    
    const value = parseFloat(match[1]);
    
    if (str.includes("h")) { // hours, hour, h
      return Math.floor(value * 3600);
    } else if (str.includes("m")) { // mins, minute, m
      return Math.floor(value * 60);
    }
    
    return DEFAULT_DURATION;
  };

  const initialDuration = parseDuration(estimatedTime);

  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const logSession = useMutation(api.focus.logSession);

  // Reset timer when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Recalculate duration in case estimatedTime changed
      const dur = parseDuration(estimatedTime);
      setTimeLeft(dur);
      setIsActive(false);
      setStartTime(null);
    }
  }, [isOpen, estimatedTime]);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer finished naturally
      setIsActive(false);
      handleSessionEnd("completed");
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    if (!startTime) setStartTime(Date.now());
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleStop = async () => {
    setIsActive(false);
    // If stopped manually, it's an interruption
    await handleSessionEnd("interrupted");
    onOpenChange(false);
  };

  const handleSessionEnd = async (status: "completed" | "interrupted") => {
    if (!startTime) return;

    const endTime = Date.now();
    try {
      const minutesLogged = await logSession({
        userId, // Passing the required userId
        taskId,
        startTime,
        endTime,
        status,
      });

      if (status === "completed") {
        toast.success(`Timer finished! ${minutesLogged} mins logged.`);
        // Logic removed: We no longer auto-complete the task here.
      } else {
        toast.info(`Session paused/stopped: ${minutesLogged} mins logged`);
      }
      
      // Reset for next run if they stay on screen (or just close)
      setStartTime(null);
      
    } catch (error) {
      console.error("Failed to log session:", error);
      toast.error("Failed to save session. Check console.");
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = parseDuration(estimatedTime);
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (isActive) {
        if (confirm("Timer is running. Stop and save progress?")) {
            handleStop(); // Stop and save
        }
      } else {
        onOpenChange(open);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Focus Mode</DialogTitle>
          <DialogDescription>
            Focusing on: <span className="font-semibold text-foreground">{taskTitle}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-8">
          {/* Circular Progress Timer */}
          <div className="relative flex items-center justify-center w-56 h-56 rounded-full border-4 border-muted">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-mono font-bold tracking-wider">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-muted-foreground mt-2">
                Target: {estimatedTime || "25m"}
              </span>
            </div>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-primary transition-all duration-1000 ease-linear"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="48"
                cx="50"
                cy="50"
                strokeDasharray="301.59"
                strokeDashoffset={301.59 - (301.59 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!isActive ? (
              <Button size="lg" className="w-28 gap-2" onClick={handleStart}>
                <Play className="w-4 h-4" /> {startTime ? "Resume" : "Start"}
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="w-28 gap-2" onClick={handlePause}>
                <Pause className="w-4 h-4" /> Pause
              </Button>
            )}
            
            <Button 
              size="lg" 
              variant="destructive" 
              className="w-28 gap-2" 
              onClick={handleStop}
              disabled={!startTime && timeLeft === totalDuration}
            >
              <Square className="w-4 h-4" /> Stop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}