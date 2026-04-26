import { cn } from "@/lib/cn";

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 rounded-sm",
        className
      )}
      {...props}
    />
  );
}
