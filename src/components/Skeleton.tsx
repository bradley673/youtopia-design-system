import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  width?: number | string;
  height?: number | string;
  /** Fully rounded, for avatar/thumbnail placeholders. */
  circle?: boolean;
}

/** Content placeholder shown while data loads. Respects reduced-motion. */
export function Skeleton({ width = "100%", height = "1em", circle = false, className = "", style, ...rest }: SkeletonProps) {
  return (
    <span
      className={["skeleton", circle ? "skeleton-circle" : "", className].filter(Boolean).join(" ")}
      aria-hidden="true"
      style={{ width, height, borderRadius: circle ? "50%" : undefined, ...style }}
      {...rest}
    />
  );
}
