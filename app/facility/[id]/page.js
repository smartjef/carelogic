import Link from "next/link";
import { facilities, processFacilityReport } from "@/lib/agentic";
import FacilityDetailsPanel from "@/components/FacilityDetailsPanel";
import ExplanationSection from "@/components/ExplanationSection";

export const dynamic = "force-dynamic";

export default async function FacilityDetailPage({ params, searchParams }) {
  const { id } = await params;
  const queryParams = await searchParams;
  const query = queryParams?.query || "healthcare support";

  const facility = facilities.find((item) => item.id === id);
  if (!facility) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8">
        <p className="border border-gray-200 bg-white p-5 text-sm text-gray-700">Facility not found.</p>
      </main>
    );
  }

  const hydratedFacility = {
    ...facility,
    structured: processFacilityReport(facility.raw_report),
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Facility Decision Brief</h1>
        <Link
          href="/search"
          className="text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          Back to search
        </Link>
      </div>

      <FacilityDetailsPanel facility={hydratedFacility} />
      <div className="mt-4">
        <ExplanationSection query={query} facility={hydratedFacility} />
      </div>
    </main>
  );
}
