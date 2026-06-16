"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    _taboola?: Array<Record<string, string | boolean>>;
  }
}

interface TaboolaPlacementProps {
  containerId: string;
  mode: string;
  placement: string;
  className?: string;
  targetType?: string;
}

export default function TaboolaPlacement({
  containerId,
  mode,
  placement,
  className = "",
  targetType = "mix",
}: TaboolaPlacementProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window._taboola = window._taboola || [];
    window._taboola.push({
      mode,
      container: containerId,
      placement,
      target_type: targetType,
    });
  }, [containerId, mode, placement, targetType]);

  return <div id={containerId} className={className} />;
}
