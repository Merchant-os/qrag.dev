import React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-[#e5e7eb] bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#6b7280] ${className}`}
      role="status"
      aria-label={props["aria-label"] || "Badge"}
      {...props}
    />
  );
}
