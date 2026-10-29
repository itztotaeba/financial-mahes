import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Kartu dasar putih dengan sudut membulat — mengikuti gaya dashboard Casha. */
export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5", className)}
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
    primary: "bg-[#2141E0] text-white hover:bg-[#1a34b4]",
    danger: "bg-[#D3534C] text-white hover:bg-[#b8443e]",
    ghost: "text-[#151516] hover:bg-black/5",
    outline: "border border-black/10 bg-white text-[#151516] hover:bg-black/5",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
        "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#151516] outline-none transition placeholder:text-black/30 focus:border-[#2141E0] focus:ring-2 focus:ring-[#2141E0]/20",
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
    <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/50", className)}>
      {children}
    </label>
  );
}
