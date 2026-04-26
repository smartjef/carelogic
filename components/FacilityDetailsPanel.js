import { Badge } from "@/components/ui/badge";

export default function FacilityDetailsPanel({ facility }) {
  const mapUrl = `https://www.openstreetmap.org/?mlat=${facility.latitude}&mlon=${facility.longitude}#map=12/${facility.latitude}/${facility.longitude}`;

  return (
    <section className="border border-gray-200 bg-white p-4">
      <h2 className="text-base font-semibold text-gray-800">{facility.name}</h2>
      <p className="mt-1 text-sm text-gray-600">
        {facility.location} · PIN {facility.pincode}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {facility.structured.capabilities.map((capability) => (
          <Badge key={capability}>{capability}</Badge>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-600">
        Trust score: <span className="font-semibold text-gray-800">{facility.trustScore}</span>
      </p>
      {facility.structured.contradictions.length ? (
        <p className="mt-2 text-xs text-amber-700">
          Trust flag: {facility.structured.contradictions[0]}
        </p>
      ) : null}
      <a
        href={mapUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs font-semibold text-teal-700 hover:text-teal-800"
      >
        Open location map
      </a>
      <p className="mt-4 text-sm leading-6 text-gray-700">{facility.raw_report}</p>
      {facility.structured.evidence.length ? (
        <div className="mt-4 border-t border-gray-200 pt-3">
          <p className="text-xs font-semibold uppercase text-gray-600">Agent evidence trace</p>
          <ul className="mt-2 space-y-1 text-xs text-gray-700">
            {facility.structured.evidence.slice(0, 3).map((item, idx) => (
              <li key={`${item.capability}-${idx}`}>
                [{item.capability}] {item.sentence}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
