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
    // Mobile: Horizontal Scroll (Carousel) | Desktop: Grid
    <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:gap-7 md:grid-cols-3 md:overflow-visible snap-x snap-mandatory hide-scrollbar">

      {/* Card 1 */}
      <Card className="min-w-[75vw] md:min-w-0 snap-center text-center glass border-border/50 hover:shadow-primary/60 hover:scale-105 transition-all duration-400">
        <CardHeader className="flex flex-row items-center justify-center gap-6 md:gap-5 space-y-0">
          <CardTitle className="text-lg md:text-sm font-medium">Total Goals</CardTitle>
          <Target className="h-6 w-6 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalGoals}</div>
          <p className="text-xs text-muted-foreground">
            {activeGoals} active now
          </p>
        </CardContent>
      </Card>

      {/* Card 2 */}
      <Card className="min-w-[75vw] md:min-w-0 snap-center text-center glass border-border/50 relative overflow-hidden hover:shadow-orange-500/60 hover:scale-105 transition-all duration-400">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/20 blur-2xl" />
        <CardHeader className="flex flex-row items-center justify-center gap-6 md:gap-5 space-y-0">
          <CardTitle className="text-lg md:text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-6 w-6 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">{currentStreak} Days</div>
          <p className="text-xs text-muted-foreground">
            Keep the momentum going!
          </p>
        </CardContent>
      </Card>

      {/* Card 3 */}
      <Card className="min-w-[75vw] md:min-w-0 snap-center text-center glass border-border/50 hover:shadow-green-500/60 hover:scale-105 transition-all duration-400">
        <CardHeader className="flex flex-row items-center justify-center gap-6 md:gap-5 space-y-0">
          <CardTitle className="text-lg md:text-sm font-medium">Completion Rate</CardTitle>
          <Trophy className="h-6 w-6 text-green-500" />
        </CardHeader>
        <CardContent>
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