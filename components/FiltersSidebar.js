"use client";

import { Button } from "@/components/ui/button";

const options = ["all", "icu", "dialysis", "emergency", "surgery"];

export default function FiltersSidebar({ selected, onChange }) {
  return (
    <aside className="border border-gray-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Filters</p>
      <div className="space-y-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={selected === option ? "default" : "outline"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onChange(option)}
          >
            {option === "all" ? "All capabilities" : option.toUpperCase()}
          </Button>
        ))}
      </div>
    </aside>
  );
}
