"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, you would send this to Sentry, LogRocket, etc.
    console.error("Dashboard caught an error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center p-8 bg-secondary/30 border border-red-500/10 rounded-2xl max-w-md w-full backdrop-blur-sm shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-50" />
        
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t border-red-500/30"
          />
          <AlertOctagon className="w-10 h-10 text-red-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">System Glitch</h2>
        
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          We encountered an unexpected issue while loading your data. This could be a temporary network hiccup or an AI processing error.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 shadow-none transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try again
          </Button>
          
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
        
        {/* Only visible in development/local environments for debugging */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6 p-4 bg-background/50 rounded-lg border border-red-500/20 text-left w-full overflow-x-auto max-h-32 custom-scrollbar">
            <p className="text-xs text-red-400 font-mono whitespace-pre-wrap">
              {error.message || "Unknown error"}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}