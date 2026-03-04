import { Clock } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export const RealTimeClock = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Avoid hydration mismatch by rendering a skeleton until mounted
  if (!time) {
    return (
      <div className="h-[72px] w-[300px] bg-secondary/10 rounded-2xl border border-white/5 animate-pulse" />
    );
  }

  const hours = time.getHours() % 12 || 12;
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  const dateString = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  
  // Extract and format the user's local timezone automatically
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace('_', ' ') || 'LOCAL';

  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-black/40 backdrop-blur-xl rounded-2xl shadow-[0_0_20px_rgba(147,197,253,0.4)] hover:shadow-[0_0_20px_rgba(147,197,253,0.6)] hover:scale-105 transition-all duration-300 w-fit">
            
      <Image src="/clock.png" alt="Logo" width={42} height={42} />

      
      <div className="flex flex-col">
        {/* Time Display */}
        <div className="flex items-end gap-1.5 font-mono text-2xl font-bold tracking-wider text-white leading-none">
          <span>{hours.toString().padStart(2, "0")}</span>
          <span className="text-primary/70 animate-pulse relative -top-0.5">:</span>
          <span>{minutes}</span>
          <span className="text-primary/70 animate-pulse relative -top-0.5">:</span>
          <span className="text-blue-400">{seconds}</span>
          <span className="ml-1.5 text-xs text-amber-400 uppercase tracking-widest font-sans mb-0.5">{ampm}</span>
        </div>
        
        {/* Date & Timezone Display */}
        <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mt-1.5 leading-none flex items-center gap-1.5">
          <span>{dateString}</span>
        </div>
      </div>
    </div>
  );
};