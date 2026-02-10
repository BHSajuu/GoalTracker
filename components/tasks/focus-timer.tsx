"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FocusTimerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Doc<"tasks">;
}

export function FocusTimer({ isOpen, onOpenChange, task }: FocusTimerProps) {
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const saveSession = useMutation(api.tasks.saveFocusSession);
  const toggleTaskCompletion = useMutation(api.tasks.toggleComplete);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSessionSeconds(0);
      const estMinutes = task.estimatedTime || 0;
      const actualMinutes = task.actualTime || 0;
      setRemainingSeconds((estMinutes * 60) - (actualMinutes * 60));
      setStatus("idle");
      setIsCompleted(false);
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

  const handleFinishSession = async () => {
    const duration = Math.ceil(sessionSeconds / 60);
    if (duration <= 0 && sessionSeconds < 10) {
        onOpenChange(false);
        return;
    }
    try {
      await saveSession({
        userId: task.userId,
        taskId: task._id,
        startTime: Date.now() - (sessionSeconds * 1000),
        endTime: Date.now(),
        duration,
        status: "completed",
      });
      if (isCompleted && !task.completed) {
        await toggleTaskCompletion({ id: task._id });
        toast.success(`Task completed! (+${duration}m)`);
      } else {
        toast.success(`Session saved (+${duration}m)`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const formatTime = (totalSeconds: number) => {
    const isNeg = totalSeconds < 0;
    const abs = Math.abs(totalSeconds);
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    
    const hDisplay = h.toString().padStart(2, "0");
    const mDisplay = m.toString().padStart(2, "0");
    const sDisplay = s.toString().padStart(2, "0");

    return `${isNeg ? "-" : ""}${hDisplay}:${mDisplay}:${sDisplay}`;
  };

  // Circle Math
  const totalEstSeconds = (task.estimatedTime || 30) * 60;
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / totalEstSeconds) * 100));
  
  const radius = 125; 
  const strokeWidth = 10;
  const center = radius + strokeWidth; 
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;
  const isOvertime = remainingSeconds < 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
       if(!open && status === "running") { if(confirm("Discard session?")) onOpenChange(false); } 
       else onOpenChange(open); 
    }}>
      <DialogContent className="sm:max-w-[450px] bg-background border shadow-2xl rounded-3xl p-0 overflow-hidden outline-none">
        
        {/* Header */}
        <div className="flex flex-col items-center pt-6 pb-4 border-b bg-muted/30">
            <DialogTitle className="font-semibold text-xl text-gray-950 text-center px-6 line-clamp-1 bg-[#FFD41D]/60 rounded-full">
                {task.title}
            </DialogTitle>
        </div>

        <div className="flex flex-col items-center justify-center pt-10 pb-10 bg-background">
            <div className="relative w-[270px] h-[270px] flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                    <circle 
                        cx={center} cy={center} r={radius} 
                        className="stroke-muted/50" 
                        strokeWidth={strokeWidth} 
                        fill="none" 
                    />
                    {/* Active Progress */}
                    <circle 
                        cx={center} cy={center} r={radius} 
                        className={cn("transition-all duration-1000 ease-in-out", isOvertime ? "stroke-destructive" : "stroke-primary")}
                        strokeWidth={strokeWidth} 
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={isOvertime ? 0 : offset}
                    />
                </svg>
                
                <div className="absolute text-center flex flex-col items-center">
                    {/* H:M:S Format */}
                    <span className={cn(
                        "text-5xl font-mono font-bold tracking-tighter tabular-nums", 
                        isOvertime && "text-destructive"
                    )}>
                        {formatTime(remainingSeconds)}
                    </span>
                    <p className={cn(
                        "text-xs uppercase tracking-[0.2em] mt-2 font-semibold",
                        isOvertime ? "text-destructive animate-pulse" : "text-muted-foreground"
                    )}>
                        {isOvertime ? "Overtime" : "Time Remaining"}
                    </p>
                </div>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 divide-x divide-border w-full mt-6 px-4">
                <div className="text-center px-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Current Session</p>
                    <p className="text-xl font-mono font-semibold text-foreground">{formatTime(sessionSeconds)}</p>
                </div>
                <div className="text-center px-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Spent</p>
                    <p className="text-xl font-mono font-semibold text-primary">
                        {Math.floor(((task.actualTime || 0) * 60 + sessionSeconds) / 60)}m
                    </p>
                </div>
            </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-muted/30 space-y-4">
             <div className="flex gap-4">
                 {status === "running" ? (
                     <Button className="flex-1 h-10 text-lg text-gray-100 font-medium shadow-sm bg-red-300/50 hover:bg-red-500/60" onClick={pauseTimer}>
                         <Pause className="w-6 h-6 mr-2" /> Pause
                     </Button>
                 ) : (
                     <Button className="flex-1 h-10 text-lg font-medium shadow-md" onClick={startTimer}>
                         <Play className="w-6 h-6 mr-2 fill-current" /> {status === "paused" ? "Resume" : "Start Focus"}
                     </Button>
                 )}
                 <Button 
                    variant="destructive" 
                    className="aspect-square h-10 w-10 p-0 rounded-lg shadow-sm hover:scale-105 transition-transform" 
                    disabled={sessionSeconds === 0}
                    onClick={handleFinishSession}
                    title="Stop & Save"
                >
                    <Square className="w-6 h-6 fill-current" />
                 </Button>
             </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}