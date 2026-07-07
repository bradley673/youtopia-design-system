import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. One primary action per view. */
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const sizeClass: Record<ButtonSize, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

/**
 * Youtopia button. Labels should say exactly what happens
 * ("Send reminder", not "Submit").
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", type = "button", ...rest },
  ref
) {
  const cls = ["btn", `btn-${variant}`, sizeClass[size], className].filter(Boolean).join(" ");
  return <button ref={ref} type={type} className={cls} {...rest} />;
});
