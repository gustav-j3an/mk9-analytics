// src/components/ui/progress.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<"div"> {
  value?: number;
  className?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full bg-[var(--mk-bg-secondary)] rounded-full h-2.5",
          className
        )}
        {...props}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div
          className="flex h-2.5 w-0 bg-[var(--mk-primary)] transition-all duration-500 rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";