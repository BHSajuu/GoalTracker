"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle2, ChartSpline } from "lucide-react";
import { cn } from "@/lib/utils";

const CustomizedLabel = ({ x, y, stroke, value }: any) => {
  return (
    <text x={x} y={y} dy={-4} fill={stroke} fontSize={10} textAnchor="middle" fontWeight="bold">
      {value}m
    </text>
  );
};

const CustomizedAxisTick = ({ x, y, payload }: any) => {
  // Truncate long names for the axis
  const text = payload.value.length > 10 ? `${payload.value.substring(0, 10)}...` : payload.value;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dy={16} 
        textAnchor="end" 
        className="fill-muted-foreground text-xs" 
        transform="rotate(-35)"
      >
        {text}
      </text>
    </g>
  );
};


export function EfficiencyChart({ userId }: { userId: Id<"users"> }) {
  const data = useQuery(api.tasks.getEfficiencyStats, { userId });

  if (data === undefined) {
    return <Skeleton className="w-full h-[450px] rounded-xl" />;
  }

  // Calculate efficiency metrics for the Header Insight
  let totalEst = 0;
  let totalAct = 0;
  data.forEach((d) => {
    totalEst += d.estimated || 0;
    totalAct += d.actual || 0;
  });

  const efficiencyRatio = totalEst > 0 ? (totalAct / totalEst) : 0;
  const percentage = Math.abs(Math.round((1 - efficiencyRatio) * 100));
  
  let statusColor = "text-blue-500";
  let statusIcon = CheckCircle2;
  let statusText = "On Track";

  if (efficiencyRatio > 1.15) {
    statusColor = "text-red-500";
    statusIcon = TrendingUp;
    statusText = "Underestimating";
  } else if (efficiencyRatio < 0.85) {
    statusColor = "text-green-500";
    statusIcon = TrendingDown;
    statusText = "Overestimating";
  }

  return (
    <Card className="col-span-2 glass-card flex flex-col shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Efficiency Trends</CardTitle>
                <CardDescription>
                    Estimated vs. Actual duration per task
                </CardDescription>
            </div>
            <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border bg-background/50", statusColor)}>
               <ChartSpline className="w-4 h-4 hidden md:block" />
               <span className="text-center">{statusText} ({percentage}%)</span>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-2">
        {data.length < 2 ? (
          <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground text-center border-2 border-dashed border-secondary rounded-xl">
             <div className="p-4 bg-secondary/50 rounded-full mb-3">
                <AlertCircle className="w-8 h-8 opacity-50" />
             </div>
             <p className="text-sm">Not enough data to generate graph.</p>
             <p className="text-xs mt-1">Complete at least 2 tasks using Focus Mode.</p>
          </div>
        ) : (
          <div className="w-full h-[400px]">
            {/* Wrapped in ResponsiveContainer to ensure it fits the Card properly */}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                
                <XAxis 
                    dataKey="name" 
                    height={60} 
                    tick={CustomizedAxisTick} 
                    interval={0} // Force show all ticks
                />
                
                <YAxis className="text-xs fill-muted-foreground" />
                
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))", 
                        borderColor: "hsl(var(--border))", 
                        borderRadius: "8px",
                        color: "hsl(var(--popover-foreground))"
                    }} 
                />
                
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                
                {/* Actual Time - Mapped to 'pv' style (Purple) */}
                <Line 
                    type="monotone" 
                    dataKey="actual" 
                    name="Actual Time"
                    stroke="#8884d8" 
                    strokeWidth={2}
                    label={CustomizedLabel}
                    activeDot={{ r: 8 }}
                />
                
                {/* Estimated Time - Mapped to 'uv' style (Green) */}
                <Line 
                    type="monotone" 
                    dataKey="estimated" 
                    name="Estimated Time"
                    stroke="#82ca9d" 
                    strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}