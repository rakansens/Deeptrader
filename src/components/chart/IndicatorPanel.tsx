"use client";

import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface IndicatorPanelProps extends HTMLAttributes<HTMLDivElement> {}

const IndicatorPanel = forwardRef<HTMLDivElement, IndicatorPanelProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-full bg-background border-t border-border", className)}
        {...props}
      />
    );
  },
);
IndicatorPanel.displayName = "IndicatorPanel";

export default IndicatorPanel;
