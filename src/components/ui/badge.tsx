import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "green" | "orange" | "gray" | "red" | "blue";
};

const toneClass: Record<NonNullable<BadgeProps["tone"]>, string> = {
  green: "bg-green-100 text-green-900",
  orange: "bg-orange-100 text-orange-900",
  gray: "bg-slate-100 text-slate-700",
  red: "bg-red-100 text-red-900",
  blue: "bg-sky-100 text-sky-900",
};

export function Badge({ className, tone = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
