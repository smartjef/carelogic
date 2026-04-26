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
  const [viewMode, setViewMode] = useState("list");

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
        value: (() => {
          const lh = data.interpretedIntent?.locationHint;
          if (!lh) return "none";
          const parts = [lh.district, lh.state, lh.pincode].filter(Boolean);
          return parts.length > 0 ? parts.join(", ") : "none";
        })(),
      },
      { label: "Simulated corpus", value: `${data.indexStats?.simulatedCorpus || 10000}` },
    ],
    [data]
  );

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
    setPage(1);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Facility Capability Search</h1>
        <Link href="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
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
            <p className="text-xs uppercase text-gray-600 font-bold tracking-tight">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-gray-800 truncate">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="mb-4 flex justify-end">
        <div className="flex overflow-hidden border border-gray-200 bg-white">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${viewMode === "list" ? "bg-teal-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${viewMode === "map" ? "bg-teal-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            Map View
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${viewMode === "list" ? "lg:grid-cols-[220px_minmax(0,1fr)]" : "lg:grid-cols-1"}`}>
        {viewMode === "list" && (
          <FiltersSidebar
            selected={selectedCapability}
            onChange={(value) => {
              setSelectedCapability(value);
              setPage(1);
            }}
          />
        )}
        <div className="min-w-0">
          {loading ? (
            <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              <p className="mt-3">Analyzing 10,000 healthcare reports...</p>
            </div>
          ) : viewMode === "list" ? (
            <>
              <FacilityTable 
                facilities={paginatedFacilities} 
                query={debouncedQuery} 
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <div className="mt-3 grid grid-cols-3 items-center border border-gray-200 bg-white p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Page size:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-8 border border-gray-300 bg-white px-1 text-xs"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                <div className="text-center text-xs text-gray-600 font-medium">
                  Showing {orderedFacilities.length > 0 ? (effectivePage - 1) * pageSize + 1 : 0} - {Math.min(effectivePage * pageSize, orderedFacilities.length)} of {orderedFacilities.length} facilities
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={effectivePage === 1}
                    className="h-8 border border-gray-300 px-4 text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={effectivePage === totalPages}
                    className="h-8 border border-gray-300 px-4 text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[600px] border border-gray-200 bg-white p-2">
              <FacilityMap facilities={orderedFacilities} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
