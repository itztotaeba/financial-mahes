import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Kartu dasar "Fresh Earthy" — putih bersih, radius besar, border halus, shadow tipis. */
export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("glass-card p-5 sm:p-6", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

/** Tombol varian: primary (olive), danger (terracotta), ghost, outline. */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-income text-white rounded-xl shadow-soft hover:bg-muted active:scale-[0.98]",
    danger: "bg-expense text-white rounded-xl shadow-soft hover:bg-[#a2552a]",
    ghost: "text-ink hover:bg-black/5",
    outline: "rounded-xl border border-line bg-white px-4 py-2 text-ink hover:bg-[#FAFAF9]",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
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
        "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted-ink focus:border-income/60 focus:bg-white focus:ring-2 focus:ring-income/15",
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
