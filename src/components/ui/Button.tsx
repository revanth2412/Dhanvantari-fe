import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { haptic, type HapticPattern } from "@/lib/haptics";

type Variant =
  "primary" | "accent" | "secondary" | "ghost" | "soft" | "danger" | "danger-soft";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  /** Icon-only square button. */
  iconOnly?: boolean;
  /** Tap feedback on touch devices; pass `false` to stay silent. */
  haptics?: HapticPattern | false;
  children?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: "ui-btn--primary",
  accent: "ui-btn--accent",
  secondary: "",
  ghost: "ui-btn--ghost",
  soft: "ui-btn--soft",
  danger: "ui-btn--danger",
  "danger-soft": "ui-btn--danger-soft",
};

/** Primary/accent buttons commit something, so they get a firmer tap. */
const defaultHaptic: Record<Variant, HapticPattern> = {
  primary: "medium",
  accent: "medium",
  danger: "warning",
  "danger-soft": "light",
  secondary: "light",
  ghost: "light",
  soft: "light",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  block = false,
  iconOnly = false,
  haptics,
  className,
  children,
  disabled,
  type = "button",
  onClick,
  ...rest
}: ButtonProps) {
  const classes = [
    "ui-btn",
    variantClass[variant],
    size !== "md" ? `ui-btn--${size}` : "",
    block ? "ui-btn--block" : "",
    iconOnly ? "ui-btn--icon" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (haptics !== false) haptic(haptics ?? defaultHaptic[variant]);
    onClick?.(e);
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      {...rest}
    >
      {loading && <span className="ui-btn__spinner" aria-hidden />}
      {children}
    </button>
  );
}
