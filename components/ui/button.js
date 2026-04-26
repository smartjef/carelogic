import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:pointer-events-none disabled:opacity-50 border border-transparent",
  {
    variants: {
      variant: {
        default: "bg-teal-600 text-white hover:bg-teal-700",
        outline: "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
        ghost: "text-gray-700 hover:bg-gray-100",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-sm",
        sm: "h-8 px-3 rounded-sm text-xs",
        lg: "h-10 px-6 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
