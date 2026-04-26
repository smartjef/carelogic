import { cn } from "@/lib/cn";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-9 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-sm",
        className
      )}
      {...props}
    />
  );
}
