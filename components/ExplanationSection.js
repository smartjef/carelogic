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

  const renderContent = (content) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("###")) {
        return <h3 key={i} className="mt-4 text-sm font-bold text-gray-900 border-b border-gray-100 pb-1">{line.replace("###", "").trim()}</h3>;
      }
      if (line.startsWith(">")) {
        return <blockquote key={i} className="mt-2 border-l-4 border-teal-500 bg-teal-50 p-2 text-xs italic text-teal-900">{line.replace(">", "").trim()}</blockquote>;
      }
      if (line.startsWith("**")) {
        return <p key={i} className="mt-2 text-sm font-semibold text-gray-800">{line.replace(/\*\*/g, "")}</p>;
      }
      return <p key={i} className="mt-1 text-sm text-gray-700 leading-relaxed">{line}</p>;
    });
  };

  return (
    <section className="border border-gray-200 bg-white p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-teal-600 mb-2">Agent Reasoning Trace</p>
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-teal-600" />
          <p className="text-sm text-gray-500">Executing agentic verification logic...</p>
        </div>
      ) : (
        <div className="space-y-1">{renderContent(text)}</div>
      )}
    </section>
  );
}
