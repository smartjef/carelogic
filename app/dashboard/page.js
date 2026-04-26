import Link from "next/link";
import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";
import { facilities, identifyMedicalDeserts } from "@/lib/agentic";

export default async function DashboardPage() {
  const session = await auth();
  const dialysisDeserts = identifyMedicalDeserts("dialysis").slice(0, 3);
  const oncologyDeserts = identifyMedicalDeserts("oncology").slice(0, 3);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6">
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
        <div className="border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-800">Serving A Nation: India capability search</h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Search by patient need (e.g. "Appendectomy in Rural Bihar"), district, or state. Review verified facilities ranked by 
            <span className="font-semibold text-teal-700"> Trust Score </span> 
            and 
            <span className="font-semibold text-teal-700"> Statistical Confidence</span>.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex h-10 items-center border border-teal-600 bg-teal-600 px-6 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            Open Search Workspace
          </Link>
        </div>

        <div className="border border-red-100 bg-red-50 p-6">
          <h2 className="text-base font-semibold text-red-800 flex items-center">
            <span className="mr-2">🚨</span> Agent Alert: Identified Medical Deserts
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Critical: Dialysis Gap</p>
              <ul className="mt-2 space-y-1">
                {dialysisDeserts.map(d => (
                  <li key={d.state} className="flex items-center justify-between text-xs text-red-900">
                    <span>{d.state}</span>
                    <span className="font-mono">{(d.coverage * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Critical: Oncology Gap</p>
              <ul className="mt-2 space-y-1">
                {oncologyDeserts.map(d => (
                  <li key={d.state} className="flex items-center justify-between text-xs text-red-900">
                    <span>{d.state}</span>
                    <span className="font-mono">{(d.coverage * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-[10px] italic text-red-700 border-t border-red-200 pt-2">
            *Desert identified if verified coverage is &lt;10% across registered facilities.
          </p>
        </div>
      </section>
    </main>
  );
}


