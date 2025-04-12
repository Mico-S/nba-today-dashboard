import React from "react";
import { Flame, Snowflake } from "lucide-react";

export function IconLegend() {
  const legendItems = [
    {
      Icon: Flame,
      label: "3+ Game Win Streak",
      className: "text-orange-500",
    },
    {
      Icon: Snowflake,
      label: "3+ Game Loss Streak",
      className: "text-blue-400",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-4 flex items-center justify-center flex-wrap gap-x-6 gap-y-2 px-3 py-1 border rounded-lg bg-card/50">
      {legendItems.map(({ Icon, label, className }) => (
        <div key={label} className="flex items-center space-x-1.5">
          <Icon className={`h-4 w-4 ${className}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
