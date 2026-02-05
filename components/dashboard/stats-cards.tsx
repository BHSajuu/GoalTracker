import { Target, Trophy, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  totalGoals: number;
  activeGoals: number;
  currentStreak: number;
}

export function StatsCards({ 
  totalGoals,
  activeGoals,
  currentStreak,
}: StatsCardsProps) {
  return (
    <div className="ml-14 md:ml-0 grid gap-3 md:gap-7 md:grid-cols-3">
      <Card className="w-66 h-33 md:h-auto md:w-auto glass border-border/50 hover:shadow-primary/60 hover:scale-105 transition-all duration-400">
        <CardHeader className="flex flex-row items-center justify-center gap-5 space-y-0">
          <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
          <Target className="h-6 w-6 text-primary" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="text-2xl font-bold">{totalGoals}</div>
          <p className="text-xs text-muted-foreground">
            {activeGoals} active now
          </p>
        </CardContent>
      </Card>

      <Card className="w-66 h-33 md:h-auto md:w-auto glass border-border/50 relative overflow-hidden hover:shadow-orange-500/60 hover:scale-105 transition-all duration-400">
        {/* Simple glow effect for streak */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/20 blur-2xl" />

        <CardHeader className="flex flex-row items-center justify-center gap-5 space-y-0">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-6 w-6 text-orange-500" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-orange-500">{currentStreak} Days</div>
          <p className="text-xs text-muted-foreground">
            Keep the momentum going!
          </p>
        </CardContent>
      </Card>

      <Card className="w-66 h-33 md:h-auto md:w-auto glass border-border/50 hover:shadow-green-500/60 hover:scale-105 transition-all duration-400">
        <CardHeader className="flex flex-row items-center justify-center gap-5 space-y-0 ">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <Trophy className="h-6 w-6 text-green-500" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="text-2xl font-bold">
            {totalGoals > 0
              ? Math.round(((totalGoals - activeGoals) / totalGoals) * 100)
              : 0}
            %
          </div>
          <p className="text-xs text-muted-foreground">
            Of total goals achieved
          </p>
        </CardContent>
      </Card>
    </div>
  );
}