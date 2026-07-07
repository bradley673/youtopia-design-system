import React from "react";

const PALETTE = ["var(--magenta-500)", "var(--purple-500)", "var(--purple-700)", "var(--ink-500)"];

function hashIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Full name — used for initials and to pick a stable brand colour. */
  name: string;
  src?: string;
}

/** Circular avatar. Falls back to initials on a deterministic brand colour. */
export function Avatar({ name, src, className = "", style, ...rest }: AvatarProps) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const bg = PALETTE[hashIndex(name)];
  return (
    <span
      className={["avatar", className].filter(Boolean).join(" ")}
      style={{ background: src ? undefined : bg, ...style }}
      title={name}
      {...rest}
    >
      {src ? <img src={src} alt={name} /> : initials}
    </span>
  );
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLSpanElement> {}

/** Overlapping cluster of avatars. */
export function AvatarGroup({ className = "", children, ...rest }: AvatarGroupProps) {
  return (
    <span className={["avatar-group", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}
