import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Kartu "liquid glass" dasar — permukaan translusen + blur, ala iOS. */
export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("glass-card p-5", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

/** Tombol varian: primary (blue), danger (red), ghost, outline. */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-white shadow-glass hover:bg-[#1a34b4]",
    danger: "bg-expense text-white shadow-glass hover:bg-[#b8443e]",
    ghost: "text-ink hover:bg-black/5",
    outline: "glass-pill !shadow-none px-4 py-2 text-ink hover:bg-white/80",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

/** Badge kecil untuk kategori / status. */
export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Input form standar. */
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-2xl border border-white/70 bg-white/80 px-3.5 py-2.5 text-sm text-ink shadow-inner outline-none backdrop-blur-md transition placeholder:text-muted-ink focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

/** Label field form. */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-ink", className)}>
      {children}
    </label>
  );
}
