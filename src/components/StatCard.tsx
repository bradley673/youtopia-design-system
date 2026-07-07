import React from "react";

export interface StatCardProps {
  label: string;
  /** Pre-formatted headline value, e.g. "£48,320" or a <Money /> element. */
  value: React.ReactNode;
  /** Signed percentage change; sign drives the colour and arrow. */
  deltaPct?: number;
  /** Context for the delta, e.g. "vs March". */
  deltaLabel?: string;
  /** Optional <Sparkline /> or other trend visual. */
  trend?: React.ReactNode;
  /** Flip so that a rising number reads as bad (e.g. overdue, costs). */
  invertDelta?: boolean;
}

/**
 * KPI tile: label, headline figure, a signed trend delta, and an optional
 * sparkline. The workhorse of a finance dashboard.
 */
export function StatCard({ label, value, deltaPct, deltaLabel, trend, invertDelta = false }: StatCardProps) {
  const hasDelta = typeof deltaPct === "number";
  const positive = hasDelta && deltaPct! >= 0;
  const good = invertDelta ? !positive : positive;
  const tone = !hasDelta ? "" : good ? "stat-delta-up" : "stat-delta-down";
  const arrow = positive ? "↑" : "↓";

  return (
    <div className="stat-card">
      <div className="stat-head">
        <span className="stat-label">{label}</span>
        {trend && <span className="stat-trend">{trend}</span>}
      </div>
      <div className="stat-value">{value}</div>
      {hasDelta && (
        <div className={`stat-delta ${tone}`}>
          <span aria-hidden="true">{arrow}</span>
          <span>{Math.abs(deltaPct!).toFixed(1)}%</span>
          {deltaLabel && <span className="stat-delta-label">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}
