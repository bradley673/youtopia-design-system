import React from "react";

/**
 * A small, consistent 24×24 stroke-icon set covering common finance UI needs.
 * Icons inherit `color` via currentColor and scale with the `size` prop.
 */
export type IconName =
  | "invoice" | "chart" | "wallet" | "bank" | "check" | "alert"
  | "clock" | "arrow-up" | "arrow-down" | "search" | "settings" | "download";

const PATHS: Record<IconName, React.ReactNode> = {
  invoice: <><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v3h3" /><path d="M9 11h6M9 15h6" /></>,
  chart: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="16.5" cy="14" r="1" /></>,
  bank: <><path d="M4 10h16" /><path d="M12 3 3 8h18z" /><path d="M6 10v7M10 10v7M14 10v7M18 10v7" /><path d="M4 20h16" /></>,
  check: <path d="M5 12.5 10 17.5 19 7" />,
  alert: <><path d="M12 4 3 20h18z" /><path d="M12 10v5M12 17.5v.5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  "arrow-up": <><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></>,
  "arrow-down": <><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  download: <><path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>,
};

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  /** Provide when the icon conveys meaning on its own. */
  title?: string;
}

export function Icon({ name, size = 24, title, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
