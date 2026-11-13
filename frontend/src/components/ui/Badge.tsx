import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline" | "amber";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}) => {
  const variantStyles = {
    default:
      "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60",
    amber:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
    warning:
      "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30",
    success:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.12)]",
    danger:
      "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.12)]",
    info:
      "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/25 shadow-[0_0_12px_rgba(99,102,241,0.12)]",
    outline:
      "bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  };

  const dotColors = {
    default: "bg-slate-400",
    amber: "bg-amber-500 animate-pulse",
    warning: "bg-yellow-500 animate-pulse",
    success: "bg-emerald-500 animate-pulse",
    danger: "bg-rose-500 animate-pulse",
    info: "bg-indigo-500 animate-pulse",
    outline: "bg-slate-400",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-tight border backdrop-blur-md ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
