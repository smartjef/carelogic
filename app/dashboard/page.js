import Link from "next/link";
import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";
import { facilities, identifyMedicalDeserts } from "@/lib/agentic";

export default async function DashboardPage() {
  const session = await auth();
  const dialysisDeserts = identifyMedicalDeserts("dialysis").slice(0, 3);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Healthcare Intelligence Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome back, {session?.user?.name || "Analyst"}.</p>
        </div>
        <SignOutButton />
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-600">Simulated Corpus</p>
          <p className="mt-1 text-lg font-semibold text-gray-800">10,000 reports</p>
        </div>
        <div className="border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-600">Indexed Facilities</p>
          <p className="mt-1 text-lg font-semibold text-gray-800">{facilities.length} India baseline sites</p>
        </div>
        <div className="border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-600">Query Mode</p>
          <p className="mt-1 text-lg font-semibold text-gray-800">Trust-scored agentic reasoning</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-800">Serving A Nation: India capability search</h2>
          <p className="mt-1 text-sm text-gray-600">
            Search by patient need, district, state, or PIN and instantly review ranked facilities with trust explanations.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-flex h-9 items-center border border-teal-600 bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-700"
          >
            Open Search Workspace
          </Link>
        </div>

        <div className="border border-red-100 bg-red-50 p-4">
          <h2 className="text-base font-semibold text-red-800">Agent Alert: Identified Medical Deserts</h2>
          <p className="mt-1 text-sm text-red-700">Regions with the lowest verified Dialysis coverage:</p>
          <ul className="mt-3 space-y-2">
            {dialysisDeserts.map(d => (
              <li key={d.state} className="flex items-center justify-between text-xs text-red-900 font-medium">
                <span>{d.state}</span>
                <span>{(d.coverage * 100).toFixed(1)}% Coverage</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

