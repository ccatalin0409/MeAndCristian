"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import type { EventWithRelations } from "@/types";
import type { UserLocation } from "@/lib/filters";
import { formatPrice, formatWhen } from "@/lib/format";

// Pin custom (divIcon) ca să evităm problemele cu imaginile implicite Leaflet în Next.
const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:linear-gradient(140deg,#a78bfa,#7c5cfc);transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(124,92,252,.55)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 24],
  popupAnchor: [0, -22],
});

const meIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#38bdf8;border:3px solid #fff;box-shadow:0 0 0 5px rgba(56,189,248,.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const BUCHAREST: [number, number] = [44.4268, 26.1025];

export default function MapView({
  events,
  userLocation,
  heightClass = "h-[60vh]",
  zoom = 12,
}: {
  events: EventWithRelations[];
  userLocation: UserLocation | null;
  heightClass?: string;
  zoom?: number;
}) {
  const withCoords = events.filter(
    (e) => e.venue?.lat != null && e.venue?.lng != null
  );

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : withCoords.length > 0
    ? [withCoords[0].venue!.lat!, withCoords[0].venue!.lng!]
    : BUCHAREST;

  return (
    // isolate → ține z-index-urile interne Leaflet (până la 1000) în propriul
    // context de stacking, ca să nu acopere header-ul/bottom-nav-ul aplicației.
    <div className={`${heightClass} relative isolate rounded-2xl overflow-hidden border border-border`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={meIcon}
          >
            <Popup>Ești aici</Popup>
          </Marker>
        )}

        {withCoords.map((e) => (
          <Marker
            key={e.id}
            position={[e.venue!.lat!, e.venue!.lng!]}
            icon={pinIcon}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="text-xs text-violet-700 font-medium">
                  {formatWhen(e.starts_at)}
                </p>
                <p className="font-semibold leading-snug">{e.title}</p>
                <p className="text-xs text-gray-500">{e.venue!.name}</p>
                <p className="text-xs mt-1">{formatPrice(e)}</p>
                <Link
                  href={`/event/${e.id}`}
                  className="inline-block mt-1.5 text-sm font-medium text-violet-700"
                >
                  Vezi detalii →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
