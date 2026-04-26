"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import SearchInput from "@/components/SearchInput";
import FiltersSidebar from "@/components/FiltersSidebar";
import FacilityTable from "@/components/FacilityTable";

const FacilityMap = dynamic(() => import("@/components/FacilityMap"), { ssr: false });

export default function SearchPage() {
  const [query, setQuery] = useState(
    "Find nearest facility in rural Bihar for emergency appendectomy with part-time doctors"
  );
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [selectedCapability, setSelectedCapability] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("score");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ facilities: [], interpretedIntent: null, indexStats: null });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    let active = true;
    async function search() {
      setLoading(true);
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: debouncedQuery,
          filters: { capability: selectedCapability === "all" ? null : selectedCapability },
        }),
      });
      const result = await response.json();
      if (active) {
        setData(result);
        setLoading(false);
      }
    }
    search();
    return () => {
      active = false;
    };
  }, [debouncedQuery, selectedCapability]);

  const orderedFacilities = useMemo(() => {
    const list = [...(data.facilities || [])];
    const direction = sortDirection === "asc" ? 1 : -1;

    return list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name) * direction;
      if (sortBy === "trust") return (a.trustScore - b.trustScore) * direction;
      return (a.score - b.score) * direction;
    });
  }, [data.facilities, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(orderedFacilities.length / pageSize));
  const effectivePage = Math.min(page, totalPages);
  const paginatedFacilities = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return orderedFacilities.slice(start, start + pageSize);
  }, [orderedFacilities, effectivePage, pageSize]);

  const stats = useMemo(
    () => [
      { label: "Intent", value: data.interpretedIntent?.intentCapabilities?.join(", ") || "general" },
      { label: "Urgency", value: data.interpretedIntent?.urgency || "normal" },
      {
        label: "Location hint",
        value:
          data.interpretedIntent?.locationHint?.district && data.interpretedIntent?.locationHint?.state
            ? `${data.interpretedIntent.locationHint.district}, ${data.interpretedIntent.locationHint.state}`
            : "none",
      },
      { label: "Simulated corpus", value: `${data.indexStats?.simulatedCorpus || 10000}` },
    ],
    [data]
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Facility Capability Search</h1>
        <Link href="/dashboard" className="text-sm font-medium text-teal-700">
          Back to dashboard
        </Link>
      </header>

      <section className="mb-4 border border-gray-200 bg-white p-4">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
        />
      </section>

      <section className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="border border-gray-200 bg-white p-3">
            <p className="text-xs uppercase text-gray-600">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-gray-800">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        <FiltersSidebar
          selected={selectedCapability}
          onChange={(value) => {
            setSelectedCapability(value);
            setPage(1);
          }}
        />
        <div className="min-w-0">
          <div className="mb-3 grid gap-2 border border-gray-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-gray-700">
              Sort by
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="mt-1 block h-9 w-full border border-gray-300 bg-white px-2 text-sm"
              >
                <option value="score">Relevance score</option>
                <option value="trust">Trust score</option>
                <option value="name">Facility name</option>
              </select>
            </label>

            <label className="text-xs text-gray-700">
              Direction
              <select
                value={sortDirection}
                onChange={(e) => {
                  setSortDirection(e.target.value);
                  setPage(1);
                }}
                className="mt-1 block h-9 w-full border border-gray-300 bg-white px-2 text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>

            <label className="text-xs text-gray-700">
              Page size
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="mt-1 block h-9 w-full border border-gray-300 bg-white px-2 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>

            <div className="flex items-end text-xs text-gray-600">
              Total matched facilities: {orderedFacilities.length}
            </div>
          </div>

          {loading ? (
            <div className="border border-gray-200 bg-white p-4 text-sm text-gray-600">
              Searching facilities...
            </div>
          ) : (
            <>
              <FacilityTable facilities={paginatedFacilities} query={debouncedQuery} />
              <div className="mt-3 flex items-center justify-between border border-gray-200 bg-white p-3 text-sm">
                <p className="text-gray-600">
                  Page {effectivePage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={effectivePage === 1}
                    className="h-8 border border-gray-300 px-3 text-xs disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={effectivePage === totalPages}
                    className="h-8 border border-gray-300 px-3 text-xs disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="min-w-0 lg:self-stretch">
          <FacilityMap facilities={orderedFacilities} />
        </div>
      </div>
    </main>
  );
}
