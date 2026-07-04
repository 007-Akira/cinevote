import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type GlassCardProps<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function GlassCard<T extends ElementType = "div">({
  as,
  children,
  className = "",
  ...props
}: GlassCardProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={`glass-card red-trace-border rounded-lg p-4 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
