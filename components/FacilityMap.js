"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import Link from "next/link";

const indiaCenter = [22.9734, 78.6569];

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceKm(a, b) {
  const earthRadius = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const arc =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(arc));
}

export default function FacilityMap({ facilities = [], simple = false }) {
  const [userLocation, setUserLocation] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setUserLocation(null);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const plotted = useMemo(
    () =>
      facilities.filter(
        (facility) =>
          typeof facility.latitude === "number" && typeof facility.longitude === "number"
      ),
    [facilities]
  );

  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : plotted[0]
      ? [plotted[0].latitude, plotted[0].longitude]
      : indiaCenter;

  if (simple) {
    return (
      <div className="h-full w-full overflow-hidden">
        {!mounted ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 text-[10px] text-gray-400">
            LOCATING...
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {plotted.map((facility) => (
              <CircleMarker
                key={facility.id}
                center={[facility.latitude, facility.longitude]}
                radius={8}
                pathOptions={{ color: "#0d9488", fillColor: "#0d9488", fillOpacity: 0.6 }}
              >
                <Popup>
                  <p className="font-bold text-gray-900 text-xs">{facility.name}</p>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-[420px] flex-col border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-gray-600">Live Geo View</p>
        <p className="text-xs text-gray-600">
          Showing {plotted.length} facilities
          {userLocation ? " + your location" : ""}
        </p>
      </div>

      <div className="h-full min-h-[340px] w-full flex-1 overflow-hidden border border-gray-200">
        {!mounted ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 text-xs text-gray-400">
            Initializing satellite view...
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={userLocation ? 8 : 5}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {userLocation ? (
              <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={8} pathOptions={{ color: "#2563eb" }}>
                <Popup>Your current location</Popup>
              </CircleMarker>
            ) : null}

            {plotted.map((facility) => {
              const distance = userLocation
                ? distanceKm(userLocation, { lat: facility.latitude, lng: facility.longitude })
                : null;

              return (
                <CircleMarker
                  key={facility.id}
                  center={[facility.latitude, facility.longitude]}
                  radius={7}
                  pathOptions={{ color: "#0d9488" }}
                >
                  <Popup>
                    <p className="font-semibold text-gray-900">{facility.name}</p>
                    <p className="text-xs text-gray-600">{facility.location}</p>
                    <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                      <span className="text-[10px] font-bold text-teal-700">TRUST: {facility.trustScore}</span>
                      <Link 
                        href={`/facility/${facility.id}`} 
                        className="text-[10px] font-bold text-teal-700 hover:underline"
                      >
                        VIEW BRIEF →
                      </Link>
                    </div>
                    {distance !== null ? <p className="mt-1 text-[9px] text-gray-400 italic">Approx. {distance.toFixed(1)} km from you</p> : null}
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </section>
  );
}
