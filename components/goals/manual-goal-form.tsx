"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, LayoutTemplate, Target, CalendarDays, Palette, AlignLeft, Wand2, Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const colorOptions = [
  "#00d4ff", "#7c3aed", "#10b981", "#f8bd56",
  "#ef4444", "#e07fb0", "#292cdb", "#155f57",
];

interface ManualGoalFormProps {
  userId: Id<"users">;
}

export function ManualGoalForm({ userId }: ManualGoalFormProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const [isSuggestingDesc, setIsSuggestingDesc] = useState(false);
  
  const currentTitle = watch("title");
  const currentColor = watch("color");

  const suggestDescription = useAction(api.ai.suggestDescription);
  const usage = useQuery(api.rateLimit.getUsage, { userId });
  const isRateLimited = usage !== undefined && usage >= 8;

  const handleSuggestDescription = async () => {
    if (isRateLimited) {
      window.dispatchEvent(new Event("show-rate-limit-dialog"));
      return;
    }
    
    if (!currentTitle?.trim()) {
      toast.error("Please enter a Goal Title first.");
      return;
    }

    setIsSuggestingDesc(true);
    try {
      const suggestion = await suggestDescription({ userId, title: currentTitle.trim(), type: "goal" });
      setValue("description", suggestion, { shouldValidate: true, shouldDirty: true });
      toast.success("Description auto-filled!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to suggest description.");
    } finally {
      setIsSuggestingDesc(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-muted-foreground" /> Goal Title</Label>
        <Input
          placeholder="e.g., Master AI & Machine Learning"
          {...register("title")}
          className={cn(
            "h-11 bg-secondary/30 border-white/10 focus:border-primary/50 transition-colors",
            errors.title && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message as string}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Target className="w-4 h-4 text-muted-foreground" /> Category</Label>
          <Input
            placeholder="e.g., Web Dev"
            {...register("category")}
            className={cn(
              "bg-secondary/30 border-white/10",
              errors.category && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.category && <p className="text-xs text-red-500 font-medium">{errors.category.message as string}</p>}
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" /> Target Date</Label>
          <Input
            type="date"
            {...register("targetDate")}
            className="bg-secondary/30 border-white/10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2"><AlignLeft className="w-4 h-4 text-muted-foreground" /> Description</Label>

          <button
            type="button"
            onClick={handleSuggestDescription}
            disabled={isSuggestingDesc || !currentTitle?.trim()}
            className={cn(
              "h-7 text-xs px-3 rounded-full transition-all duration-300 relative overflow-hidden group",
              isSuggestingDesc
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-transparent hover:border-blue-500/20"
            )}
          >
            {!isSuggestingDesc && (
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 1 }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0"
              />
            )}

            <div className="flex items-center gap-1.5 relative z-10">
              {isSuggestingDesc ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              )}
              {isSuggestingDesc ? "Synthesizing..." : "AI Auto-fill"}
            </div>
          </button>
        </div>

        <div className="relative rounded-md overflow-hidden group">
          <Textarea
            placeholder="Describe your goal..."
            {...register("description")}
            disabled={isSuggestingDesc}
            className={cn(
              "bg-secondary/30 border-white/10 resize-none min-h-[100px] transition-all duration-300",
              isSuggestingDesc && "opacity-30 blur-[2px]"
            )}
          />

          <AnimatePresence>
            {isSuggestingDesc && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[1px] border border-blue-500/30 rounded-md"
              >
                <motion.div
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_rgba(59,130,246,1)] z-20"
                />

                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="p-2 bg-blue-500/20 rounded-full border border-blue-500/40"
                  >
                    <Bot className="w-5 h-5 text-blue-400" />
                  </motion.div>
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-[10px] font-bold tracking-widest text-blue-400 uppercase bg-background/80 px-2 py-0.5 rounded-full"
                  >
                    Writing
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <Label className="flex items-center gap-2"><Palette className="w-4 h-4 text-muted-foreground" /> Color Theme</Label>
        <div className="flex flex-wrap gap-3">
          {colorOptions.map((c) => (
            <motion.button
              key={c}
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setValue("color", c, { shouldDirty: true })}
              className={cn(
                "w-8 h-8 rounded-full shadow-sm transition-all border-2",
                currentColor === c ? "border-foreground ring-2 ring-offset-2 ring-offset-background" : "border-transparent opacity-70 hover:opacity-100"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </>
  );
}