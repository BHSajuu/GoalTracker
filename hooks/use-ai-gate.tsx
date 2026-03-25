"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sparkles, Settings, Terminal, Cpu } from "lucide-react";

export function useAIGate() {
  const { userId } = useAuth();
  const user = useQuery(api.users.getById, userId ? { id: userId } : "skip");
  
  const [showDialog, setShowDialog] = useState(false);

  const withAIGate = (action: () => void) => {
    if (user === undefined) return;

    const isAiEnabled = user?.preferences?.enableAiFeatures ?? true;

    if (isAiEnabled) {
      action();
    } else {
      setShowDialog(true);
    }
  };

  const AIGateDialog = () => (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="w-[90vw] sm:max-w-md p-0 overflow-hidden bg-background/95 backdrop-blur-3xl border-white/10 shadow-[0_0_100px_rgba(0,212,255,0.1)] ring-1 ring-white/5 z-[99999]">
        
        <div className="p-6 relative">
          <AlertDialogHeader>
           
           <div className="flex items-center justify-between gap-3 md:gap-6">
             <div className="mx-auto  mb-6 relative">
              <div className="relative w-12 h-12  md:w-20 md:h-20 rounded-full border-2 border-white/10 overflow-hidden bg-secondary/20 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
                <Cpu className="w-6 h-6 md:w-10 md:h-10 text-primary opacity-80" />
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary absolute top-4 right-4 animate-pulse" />
              </div>
            </div>
            
            <AlertDialogTitle className="mb-7 text-center text-xl md:text-2xl font-bold text-foreground font-mono tracking-tight">
              AI_SUBSYSTEM_OFFLINE
            </AlertDialogTitle>
           </div>
            
            <AlertDialogDescription className="text-center text-sm text-muted-foreground leading-relaxed">
              Your artificial intelligence modules are currently disabled. Enable AI in your preferences to unlock smart goal generation, intelligent task breakdowns, and automated insights.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-8 flex flex-row   items-center justify-between md:gap-10 md:mr-10 ">
            <AlertDialogCancel className="w-36 md:w-44 mt-0 sm:mt-0 bg-black/40 border-white/10 text-muted-foreground hover:bg-black/60 hover:text-foreground transition-colors font-mono text-xs">
              Not right now
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDialog(false);
                window.dispatchEvent(new Event("open-profile-dialog"));
              }}
              className="w-44 mt-0 bg-primary text-primary-foreground font-bold shadow-[0_0_20px_rgba(0,212,255,0.2)] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all font-mono text-xs"
            >
              <Settings className="w-4 h-4 mr-2" />
              Enable AI Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { withAIGate, AIGateDialog };
}