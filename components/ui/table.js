import { cn } from "@/lib/cn";

export function Table({ className, ...props }) {
  return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />;
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-gray-200", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return <tr className={cn("border-b border-gray-200 hover:bg-gray-50", className)} {...props} />;
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn("h-10 px-3 text-left align-middle font-medium text-gray-700", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return <td className={cn("p-3 align-middle text-gray-800", className)} {...props} />;
}
