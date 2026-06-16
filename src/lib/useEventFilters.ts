import { useEffect, useMemo, useState } from "react";
import type { EventWithRelations } from "@/types";
import {
  EMPTY_FILTERS,
  applyFilters,
  type ActiveFilters,
  type UserLocation,
} from "@/lib/filters";

// Logica comună de filtrare, folosită și de feed (Acasă) și de hartă.
// Ține starea filtrelor + geolocația și întoarce lista deja filtrată.
export function useEventFilters(events: EventWithRelations[]) {
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);

  // Cere geolocația când userul activează „Lângă mine".
  useEffect(() => {
    if (!filters.nearMe || location || !("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setFilters((f) => ({ ...f, nearMe: false }));
        alert("Nu am putut accesa locația. Verifică permisiunile.");
      }
    );
  }, [filters.nearMe, location]);

  const filtered = useMemo(
    () => applyFilters(events, filters, location),
    [events, filters, location]
  );

  return { filters, setFilters, location, locating, filtered };
}
