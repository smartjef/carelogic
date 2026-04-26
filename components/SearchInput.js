"use client";

import { Input } from "@/components/ui/input";

export default function SearchInput({ value, onChange }) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Find emergency dialysis in Bihar PIN 800001"
      className="h-10"
    />
  );
}
