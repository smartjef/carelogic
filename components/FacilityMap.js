"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

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

export default function FacilityMap({ facilities = [] }) {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
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
                  <p className="font-semibold">{facility.name}</p>
                  <p>{facility.location}</p>
                  <p>Trust: {facility.trustScore}</p>
                  {distance !== null ? <p>Approx. {distance.toFixed(1)} km from you</p> : null}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}
