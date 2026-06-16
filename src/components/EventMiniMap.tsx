"use client";

import dynamic from "next/dynamic";
import type { EventWithRelations } from "@/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-48 rounded-2xl bg-surface border border-border" />
  ),
});

// Mini-hartă pentru pagina de detaliu (un singur eveniment).
export default function EventMiniMap({ event }: { event: EventWithRelations }) {
  return (
    <MapView
      events={[event]}
      userLocation={null}
      heightClass="h-48"
      zoom={14}
    />
  );
}
