import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

const glassButtonVariants = cva(
  "relative isolate all-unset cursor-pointer rounded-full transition-all duration-300",
  {
    variants: {
      size: {
        default: "text-base font-medium",
        sm: "text-sm font-medium",
        lg: "text-lg font-medium",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const glassButtonTextVariants = cva(
  "glass-button-text relative block select-none tracking-tighter z-20",
  {
    variants: {
      size: {
        default: "px-6 py-3.5",
        sm: "px-4 py-2",
        lg: "px-8 py-4",
        icon: "flex h-10 w-10 items-center justify-center",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, ...props }, ref) => {
    return (
      <div
        className={cn(
          "glass-button-wrap cursor-pointer rounded-full relative group",
          className
        )}
      >
        <style>{`
          .glass-button {
            position: relative;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 9999px;
            box-shadow: 
              0 8px 32px 0 rgba(0, 0, 0, 0.08),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.8),
              inset 0 -1px 2px 0 rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            outline: none;
            width: 100%;
          }
          
          .glass-button::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.5) 0%,
              rgba(255, 255, 255, 0.2) 20%,
              rgba(255, 255, 255, 0) 100%
            );
            pointer-events: none;
            z-index: 1;
          }
          
          .glass-button:hover {
            transform: scale(1.02) translateY(-1px);
            background: rgba(255, 255, 255, 0.25);
            box-shadow: 
              0 12px 40px 0 rgba(0, 0, 0, 0.12),
              inset 0 1px 2px 0 rgba(255, 255, 255, 0.9);
          }
          
          .glass-button:active {
            transform: scale(0.98) translateY(0);
            box-shadow: 
              0 4px 12px 0 rgba(0, 0, 0, 0.1),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.4);
          }
          
          .glass-button-shadow {
            position: absolute;
            inset: -4px;
            background: rgba(0, 0, 0, 0.05);
            filter: blur(12px);
            border-radius: 9999px;
            z-index: -1;
            opacity: 0;
            transition: opacity 0.4s ease;
          }
          
          .glass-button-wrap:hover .glass-button-shadow {
            opacity: 1;
          }
        `}</style>
        <button
          className={cn("glass-button", glassButtonVariants({ size }))}
          ref={ref}
          {...props}
        >
          <span
            className={cn(
              glassButtonTextVariants({ size }),
              contentClassName
            )}
          >
            {children}
          </span>
        </button>
        <div className="glass-button-shadow rounded-full pointer-events-none"></div>
      </div>
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };
