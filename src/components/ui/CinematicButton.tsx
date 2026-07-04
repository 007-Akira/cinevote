import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type SharedProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type CinematicButtonProps =
  | (SharedProps &
      ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: undefined;
      })
  | (SharedProps &
      AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
      });

type AnchorButtonProps = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type NativeButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-cine-red text-cine-text-primary shadow-red-glow-sm hover:bg-cine-red-dark",
  secondary:
    "border border-cine-red/50 bg-cine-red/10 text-cine-text-primary hover:bg-cine-red/[0.18]",
  ghost: "bg-white/5 text-cine-text-secondary hover:bg-white/10 hover:text-cine-text-primary",
};

export function CinematicButton(props: CinematicButtonProps) {
  if (typeof props.href === "string") {
    const {
      children,
      className = "",
      variant = "primary",
      href,
      ...anchorProps
    } = props as AnchorButtonProps;
    const classes = getButtonClasses(variant, className);

    return (
      <a className={classes} href={href} {...anchorProps}>
        {children}
      </a>
    );
  }

  const {
    children,
    className = "",
    variant = "primary",
    type = "button",
    ...buttonProps
  } = props as NativeButtonProps;
  const classes = getButtonClasses(variant, className);

  return (
    <button className={classes} type={type} {...buttonProps}>
      {children}
    </button>
  );
}

function getButtonClasses(variant: ButtonVariant, className: string) {
  return `inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cine-red disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`;
}
