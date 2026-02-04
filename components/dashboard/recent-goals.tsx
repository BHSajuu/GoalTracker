"use client";

import React from "react"

import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Target, ArrowRight, Plus } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface RecentGoalsProps {
  goals: Doc<"goals">[];
}

export function RecentGoals({ goals }: RecentGoalsProps) {
  const recentGoals = goals
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  return (
    <div
      className="glass-card rounded-2xl p-6 animate-slide-up"
      style={{ animationDelay: "0.3s" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Recent Goals
        </h2>
        <Link
          href="/dashboard/goals"
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {recentGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">No goals yet</p>
          <Link href="/dashboard/goals?new=true">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create your first goal
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {recentGoals.map((goal, index) => (
            <Link
              key={goal._id}
              href={`/dashboard/goals/${goal._id}`}
              className="block p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: goal.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {goal.title}
                    </h3>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {goal.progress}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    {goal.category}
                  </p>
                  <Progress
                    value={goal.progress}
                    className="h-1.5"
                    style={
                      {
                        "--primary": goal.color,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
