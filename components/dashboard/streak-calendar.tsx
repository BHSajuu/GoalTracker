"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface StreakCalendarProps {
  activeDays: number[];
}

export function StreakCalendar({ activeDays }: StreakCalendarProps) {
  const [month, setMonth] = useState<Date>(new Date());

  const activeDates = activeDays.map((timestamp) => new Date(timestamp));

  const modifiers = {
    active: activeDates,
  };

  const modifiersClassNames = {
    active: "bg-primary/20 text-primary font-semibold relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
  };

  return (
    <Calendar
      mode="single"
      month={month}
      onMonthChange={setMonth}
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      className="rounded-lg border-2 p-3 shadow-lg hover:shadow-blue-300/60 hover:scale-105 transition-all duration-300"
      classNames={{
        months: "flex flex-col",
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-xs font-medium text-foreground",
        nav: "space-x-1 flex items-center justify-between mx-4",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-secondary"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.7rem]",
        row: "flex w-full mt-1",
        cell: "h-8 w-8 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          "h-8 w-8 p-0 font-normal text-xs rounded-md hover:bg-secondary transition-colors inline-flex items-center justify-center"
        ),
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_today: "border border-primary/50 text-foreground",
        day_outside: "text-muted-foreground/50",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
      }}
    />
  );
}