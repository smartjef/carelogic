"use client";

import { useEffect, useState } from "react";

export default function ExplanationSection({ query, facility }) {
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");

  useEffect(() => {
    let mounted = true;
    async function fetchExplanation() {
      setLoading(true);
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, facility }),
      });
      const data = await response.json();
      if (mounted) {
        setText(data.explanation || "No explanation available.");
        setLoading(false);
      }
    }

    fetchExplanation();
    return () => {
      mounted = false;
    };
  }, [query, facility]);

  return (
    <section className="border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Agent Reasoning</p>
      {loading ? (
        <p className="mt-3 text-sm text-gray-500">Generating recommendation rationale...</p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-gray-800">{text}</p>
      )}
    </section>
  );
}
