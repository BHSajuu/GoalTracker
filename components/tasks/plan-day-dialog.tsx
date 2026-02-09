"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarClock, ArrowRight, CheckCircle2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlanDayDialogProps {
  userId: Id<"users">;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanComplete: () => void; 
}

export function PlanDayDialog({ userId, isOpen, onOpenChange, onPlanComplete }: PlanDayDialogProps) {
  const [availableHours, setAvailableHours] = useState<number>(4);
  const [localPlanned, setLocalPlanned] = useState<Doc<"tasks">[]>([]);
  const [localOverflow, setLocalOverflow] = useState<Doc<"tasks">[]>([]);
  const [hasManualChanges, setHasManualChanges] = useState(false);
  
  // Timestamps
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Fetch suggestions
  const plan = useQuery(api.scheduler.getSuggestion, 
    isOpen ? { 
      userId, 
      availableMinutes: availableHours * 60,
      todayStart: todayStart.getTime() 
    } : "skip"
  );

  const commitPlan = useMutation(api.scheduler.commitPlan);

  // Sync backend plan to local state (only if user hasn't messed with it yet)
  useEffect(() => {
    if (plan && !hasManualChanges) {
      setLocalPlanned(plan.planned);
      setLocalOverflow(plan.overflow);
    }
  }, [plan, hasManualChanges]);

  // Reset state when closing/opening
  useEffect(() => {
    if (isOpen) setHasManualChanges(false);
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await commitPlan({
        todayIds: localPlanned.map(t => t._id),
        tomorrowIds: localOverflow.map(t => t._id),
        todayDate: today.getTime(),
        tomorrowDate: tomorrow.getTime(),
      });

      toast.success("Plan saved! Tasks updated.");
      onOpenChange(false);
      onPlanComplete(); // Switch tab
    } catch (error) {
      toast.error("Failed to save plan");
      console.error(error);
    }
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, task: Doc<"tasks">, source: "planned" | "overflow") => {
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.setData("source", source);
  };

  const handleDrop = (e: React.DragEvent, target: "planned" | "overflow") => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const source = e.dataTransfer.getData("source") as "planned" | "overflow";

    if (source === target) return; // Dropped in same list

    setHasManualChanges(true); // Lock auto-updates

    // Find the task
    const sourceList = source === "planned" ? localPlanned : localOverflow;
    const task = sourceList.find(t => t._id === taskId);
    
    if (!task) return;

    // Remove from source
    if (source === "planned") {
      setLocalPlanned(prev => prev.filter(t => t._id !== taskId));
      setLocalOverflow(prev => [...prev, task]);
    } else {
      setLocalOverflow(prev => prev.filter(t => t._id !== taskId));
      setLocalPlanned(prev => [...prev, task]);
    }
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarClock className="w-6 h-6 text-primary" />
            Plan Your Day
          </DialogTitle>
          <DialogDescription>
            Drag and drop tasks to prioritize.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Time Input */}
          <div className="flex flex-col gap-3 px-4 py-3 bg-secondary/30 rounded-xl border border-border shrink-0">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Available Time Today</Label>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{availableHours} hrs</span>
                {hasManualChanges && (
                    <span className="ml-2 text-xs text-orange-500 block">(Manual Mode)</span>
                )}
              </div>
            </div>
            <input 
              type="range" 
              min="1" 
              max="12" 
              step="0.5"
              value={availableHours}
              onChange={(e) => {
                setAvailableHours(parseFloat(e.target.value));
                setHasManualChanges(false);
              }}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Drag & Drop Columns */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
            
            {/* DO TODAY */}
            <div 
                className="flex flex-col h-full bg-card/50 border border-green-500/20 rounded-xl overflow-hidden transition-colors hover:bg-green-500/5"
                onDragOver={allowDrop}
                onDrop={(e) => handleDrop(e, "planned")}
            >
              <div className="p-3 bg-green-500/10 border-b border-green-500/20 flex justify-between items-center">
                <h4 className="font-semibold text-green-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Do Today
                </h4>
                <span className="text-xs font-mono bg-background/80 px-2 py-0.5 rounded-full">
                    {localPlanned.length} tasks
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {localPlanned.map(task => (
                  <div 
                    key={task._id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task, "planned")}
                    className="group p-3 text-sm bg-card border border-border hover:border-primary/50 cursor-grab active:cursor-grabbing rounded-lg shadow-sm flex items-start gap-3 transition-all"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5" />
                    <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className={cn(
                            "px-1.5 py-0.5 rounded capitalize",
                            task.priority === 'high' ? "bg-red-500/10 text-red-500" : "bg-secondary"
                        )}>
                            {task.priority}
                        </span>
                        <span>{task.estimatedTime || "30m"}</span>
                        </div>
                    </div>
                  </div>
                ))}
                {localPlanned.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-muted m-2 rounded-lg">
                        <span className="text-sm">Drop tasks here to do them Today</span>
                    </div>
                )}
              </div>
            </div>

            {/* MOVE TO TOMORROW */}
            <div 
                className="flex flex-col h-full bg-card/50 border border-orange-500/20 rounded-xl overflow-hidden transition-colors hover:bg-orange-500/5"
                onDragOver={allowDrop}
                onDrop={(e) => handleDrop(e, "overflow")}
            >
              <div className="p-3 bg-orange-500/10 border-b border-orange-500/20 flex justify-between items-center">
                <h4 className="font-semibold text-orange-600 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" /> Tomorrow
                </h4>
                <span className="text-xs font-mono bg-background/80 px-2 py-0.5 rounded-full">
                    {localOverflow.length} tasks
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {localOverflow.map(task => (
                  <div 
                    key={task._id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task, "overflow")}
                    className="group p-3 text-sm bg-orange-500/5 border border-orange-500/10 hover:border-orange-500/30 cursor-grab active:cursor-grabbing rounded-lg flex items-start gap-3 transition-all"
                  >
                     <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5" />
                     <div>
                        <div className="font-medium opacity-90">{task.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="bg-secondary px-1.5 py-0.5 rounded capitalize">
                                {task.priority}
                            </span>
                            <span>{task.estimatedTime || "30m"}</span>
                        </div>
                    </div>
                  </div>
                ))}
                {localOverflow.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-muted m-2 rounded-lg">
                        <span className="text-sm">Great! No overflow tasks.</span>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Save & Update Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}