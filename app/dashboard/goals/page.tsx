"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { GoalCard } from "@/components/goals/goal-card";
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Target, Filter } from "lucide-react";
import { GoalsPageSkeleton } from "@/components/goals/skeletons";

export default function GoalsPage() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const goals = useQuery(api.goals.getByUser, userId ? { userId } : "skip");

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const categories = goals
    ? Array.from(new Set(goals.map((g) => g.category)))
    : [];

  const filteredGoals = goals?.filter((goal) => {
    const matchesSearch =
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || goal.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || goal.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (!goals) {
    return <GoalsPageSkeleton />;
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            Goals
          </h1>
          <p className="text-muted-foreground">
            Manage and track your goals
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:shadow-[0_0_25px_rgba(0,212,255,0.3)] transition-all"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-4 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-border"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-secondary/50 border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-46 bg-secondary/50 border-border">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Goals Grid */}
      <div 
        className="animate-slide-up min-h-[400px]" 
        style={{ animationDelay: "0.2s" }}
      >
        {filteredGoals && filteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGoals.map((goal, index) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                style={{ 
                  animationDelay: `${0.1 + (index * 0.05)}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center border-2 border-dashed border-secondary rounded-3xl bg-secondary/5 p-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center mb-6 shadow-inner">
              <Target className="w-10 h-10 text-primary/80" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "No matching goals found"
                : "Your goal journey starts here"}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "We couldn't find any goals matching your current filters. Try adjusting them or clear all filters."
                : "Create your first goal to begin tracking your progress, building habits, and achieving your dreams."}
            </p>
            
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all" ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="rounded-xl border-secondary-foreground/20"
              >
                Clear all filters
              </Button>
            ) : (
              <Button 
                onClick={() => setIsCreateOpen(true)} 
                className="gap-2 rounded-xl h-11 px-8 shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                Create your first goal
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Goal Dialog */}
      <CreateGoalDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        userId={userId!}
      />
    </div>
  );
}
