"use client";

import { useEffect, useState } from "react";

export function useRelativeTime(
  timestamp: string | Date | null,
  fallback: string = "No detections"
): string {
  const [relativeTime, setRelativeTime] = useState<string>(
    timestamp ? "" : fallback
  );

  useEffect(() => {
    if (!timestamp) {
      setRelativeTime(fallback);
      return;
    }

    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    
    const updateTime = () => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 5) {
        setRelativeTime("just now");
      } else if (diffSecs < 60) {
        setRelativeTime(`${diffSecs}s ago`);
      } else if (diffMins < 60) {
        setRelativeTime(`${diffMins}m ${diffMins === 1 ? "" : "s"} ago`);
      } else if (diffHours < 24) {
        setRelativeTime(`${diffHours}h ${diffHours === 1 ? "" : "s"} ago`);
      } else {
        setRelativeTime(`${diffDays}d ${diffDays === 1 ? "" : "s"} ago`);
      }
    };

    updateTime();

    // Determine the interval delay based on how old the timestamp is
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    let intervalDelay = 1000; // default 1s
    if (diffSecs > 60) {
      intervalDelay = 60000; // 1m
    }

    const intervalId = setInterval(updateTime, intervalDelay);

    return () => clearInterval(intervalId);
  }, [timestamp, fallback]);

  return relativeTime;
}
