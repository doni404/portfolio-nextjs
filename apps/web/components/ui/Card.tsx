import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
}

export function Card({ children, className, hover, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white",
        hover && "transition-shadow duration-200 hover:shadow-md",
        padding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold text-slate-900", className)}>{children}</h3>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("text-slate-600", className)}>{children}</div>;
}
