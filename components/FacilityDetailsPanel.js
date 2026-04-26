"use client";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";

const FacilityMap = dynamic(() => import("@/components/FacilityMap"), { ssr: false });

export default function FacilityDetailsPanel({ facility }) {
  const phoneNumbers = (() => {
    try {
      const parsed = typeof facility.phone_numbers === 'string' && facility.phone_numbers.startsWith('[') 
        ? JSON.parse(facility.phone_numbers) 
        : facility.phone_numbers;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return [facility.phone_numbers];
    }
  })();

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="h-[400px] lg:h-auto overflow-hidden">
          <FacilityMap facilities={[facility]} simple={true} />
        </div>
        
        <div className="border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div className="max-w-[70%]">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">{facility.name}</h2>
              <p className="mt-2 text-sm text-gray-600">
                {facility.location} · {facility.address_stateOrRegion} · PIN {facility.pincode}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Trust Score</p>
              <p className="text-3xl font-black text-teal-600">{facility.structured.trustScore}</p>
              {facility.structured.trustDetails?.predictionInterval && (
                <p className="mt-1 text-[9px] font-medium text-gray-500 uppercase tracking-tighter">
                  Conf. Range: [{facility.structured.trustDetails.predictionInterval.lower}-{facility.structured.trustDetails.predictionInterval.upper}]
                  <br />
                  <span className="text-teal-600/70">{facility.structured.trustDetails.predictionInterval.uncertaintyLabel}</span>
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {facility.structured.capabilities.map((capability) => (
              <Badge key={capability} className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200 px-3 py-1">
                {capability}
              </Badge>
            ))}
          </div>

          {facility.structured.contradictions.length ? (
            <div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800">
                ⚠️ Trust Alert: {facility.structured.contradictions[0]}
              </p>
            </div>
          ) : null}

          <div className="mt-8 grid gap-8 md:grid-cols-2 border-t border-gray-100 pt-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact & Info</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                {phoneNumbers.length > 0 && phoneNumbers[0] && (
                  <li>
                    <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Phone</span>
                    {phoneNumbers.join(", ")}
                  </li>
                )}
                {facility.email && (
                  <li>
                    <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Email</span>
                    {facility.email}
                  </li>
                )}
                {facility.facilityTypeId && (
                  <li>
                    <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Facility Type</span>
                    <span className="capitalize">{facility.facilityTypeId}</span>
                  </li>
                )}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Operational Summary</h3>
              <p className="text-sm leading-relaxed text-gray-600 italic">
                "{facility.description || "No detailed description available."}"
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {facility.procedures?.length > 0 && (
          <div className="border border-gray-200 bg-white p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Procedures Offered</h3>
            <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-gray-700">
              {facility.procedures.slice(0, 12).map((p, i) => (
                <li key={i} className="flex items-center">
                  <span className="mr-2 text-teal-500">✓</span> {p}
                </li>
              ))}
              {facility.procedures.length > 12 && (
                <li className="text-xs italic text-gray-500">+{facility.procedures.length - 12} more</li>
              )}
            </ul>
          </div>
        )}

        {facility.equipment_list?.length > 0 && (
          <div className="border border-gray-200 bg-white p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Equipment Log</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {facility.equipment_list.map((e, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
