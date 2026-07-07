import React from "react";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Stroke/fill colour. Defaults to the brand magenta. */
  color?: string;
  /** Emphasise the final point with a dot. */
  showEndpoint?: boolean;
}

let uid = 0;

/**
 * Minimal trend line with a soft area fill and an emphasised endpoint —
 * the finance-dashboard staple. Decorative; pair with a labelled value.
 */
export function Sparkline({ data, width = 96, height = 28, color = "var(--accent)", showEndpoint = true }: SparklineProps) {
  const gradId = React.useMemo(() => `spark-${++uid}`, []);
  if (data.length < 2) return <svg width={width} height={height} aria-hidden="true" />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const stepX = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;
  const [ex, ey] = pts[pts.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {showEndpoint && <circle cx={ex} cy={ey} r="2.5" fill={color} />}
    </svg>
  );
}
