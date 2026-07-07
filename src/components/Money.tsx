import React from "react";

export interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Amount in major units (e.g. pounds), not pence. */
  amount: number;
  currency?: string;
  locale?: string;
  /** Hide the minor units when the amount is whole. */
  compact?: boolean;
}

/**
 * Formats a monetary value with tabular figures so it aligns in tables.
 * Defaults to GBP / en-GB for Youtopia.
 */
export function Money({ amount, currency = "GBP", locale = "en-GB", compact = false, className = "", ...rest }: MoneyProps) {
  const fractionDigits = compact && Number.isInteger(amount) ? 0 : 2;
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
  return (
    <span className={["money", className].filter(Boolean).join(" ")} {...rest}>
      {formatted}
    </span>
  );
}
