import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "secondary";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-base font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]":
              variant === "default",
            "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 active:scale-[0.98]":
              variant === "outline",
            "hover:bg-gray-100 text-gray-900": variant === "ghost",
            "text-gray-500 hover:text-gray-900 underline-offset-4 hover:underline":
              variant === "link",
            "bg-gray-100 text-gray-900 hover:bg-gray-200 active:scale-[0.98]":
              variant === "secondary",
          },
          {
            "h-12 px-6 py-3": size === "default",
            "h-10 px-4 text-sm": size === "sm",
            "h-14 px-8 text-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
