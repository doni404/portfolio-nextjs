import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "blue" | "green" | "yellow" | "red" | "gray" | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  yellow: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-1 ring-red-200",
  gray: "bg-slate-100 text-slate-600",
  purple: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
