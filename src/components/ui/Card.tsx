import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      className={`rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xl ${onClick ? "cursor-pointer hover:bg-white/15 transition" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
