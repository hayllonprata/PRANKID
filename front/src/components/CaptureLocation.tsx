"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

export function CaptureLocation() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        void api("/api/store/location", {
          method: "POST",
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        }).catch(() => undefined);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
