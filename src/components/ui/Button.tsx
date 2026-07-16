import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

const styles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:brightness-110",
  secondary:
    "bg-white/15 text-white border border-white/25 hover:bg-white/25 backdrop-blur",
  ghost: "bg-transparent text-white/90 hover:bg-white/10",
  danger: "bg-rose-500 text-white hover:bg-rose-400",
  success: "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/30",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props) {
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-xl",
    md: "px-5 py-3 text-base rounded-2xl",
    lg: "px-8 py-4 text-lg rounded-2xl font-semibold",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
