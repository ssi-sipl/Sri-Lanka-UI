"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AlertData {
  id?: string;
  name: string;
  score: number;
  source: string;
  timestamp: string;
  faceImage: string;
  category: "BLACKLIST" | "WHITELIST" | "UNKNOWN" | "WEAPON";
  acknowledged: boolean;
  cameraId?: string | null;
  camera?: {
    name: string;
  } | null;
}

interface MqttStats {
  totalAlerts: number;
  uniquePeopleCount: number;
  lastDetectionTime: string | null;
}

interface MqttContextType {
  alerts: AlertData[];
  setAlerts: React.Dispatch<React.SetStateAction<AlertData[]>>;
  mqttStatus: "connected" | "disconnected" | "reconnecting";
  stats: MqttStats;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (val: boolean) => void;
  unacknowledgedCounts: {
    blacklist: number;
    weapon: number;
    unknown: number;
    whitelist: number;
  };
  triggerReconnect: () => void;
  acknowledgeAlert: (id: string) => Promise<void>;
  acknowledgeAll: () => Promise<void>;
  clearDatabase: () => Promise<void>;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

// Web Audio API synthesized audio alerts (No external asset dependency)
const playChime = (category: string) => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (category === "BLACKLIST" || category === "WEAPON") {
      // Urgent, loud dual sawtooth sweep alarm for threats
      const duration = 0.6;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "sawtooth";

      // Dual detuned frequencies
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + duration);
      osc2.frequency.setValueAtTime(445, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(885, ctx.currentTime + duration);

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);
    } else if (category === "UNKNOWN") {
      // E5 -> A5 gentle cyber chirp for unknown detections
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      
      // Detuned chirp sweep
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880.00, now + 0.12); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.35);
    }
    // "WHITELIST" remains silent
  } catch (e) {
    console.warn("Audio Context playback failed:", e);
  }
};

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [mqttStatus, setMqttStatus] = useState<"connected" | "disconnected" | "reconnecting">("disconnected");
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [reconnectCounter, setReconnectCounter] = useState(0);

  // Load sound preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("alert_sound_enabled");
    if (saved !== null) {
      setIsSoundEnabled(saved === "true");
    }
  }, []);

  const handleSetSoundEnabled = (val: boolean) => {
    setIsSoundEnabled(val);
    localStorage.setItem("alert_sound_enabled", String(val));
  };

  // Fetch alert history (hydrates grid)
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts?limit=100");
      const json = await res.json();
      if (json.success && json.data) {
        setAlerts(json.data);
      }
    } catch (e) {
      console.error("Failed to load initial alerts history:", e);
    }
  }, []);

  // Set up EventSource connection for Server-Sent Events (SSE)
  useEffect(() => {
    fetchHistory();

    setMqttStatus("reconnecting");
    const eventSource = new EventSource("/api/alerts/sse");

    eventSource.onopen = () => {
      console.log("[SSE Connection] Established successfully!");
      setMqttStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const newAlert: AlertData = JSON.parse(event.data);
        console.log("[SSE Event Received] Alert ID:", newAlert.id, "Category:", newAlert.category);
        
        setAlerts((prev) => {
          // Avoid duplicate inserts
          if (prev.some((a) => a.id === newAlert.id)) return prev;
          return [newAlert, ...prev].slice(0, 150); // limit local state to 150 alerts
        });

        // Trigger sound warning
        if (isSoundEnabled) {
          playChime(newAlert.category);
        }
      } catch (err) {
        console.error("Failed to parse SSE payload:", err);
      }
    };

    eventSource.onerror = (e) => {
      console.warn("[SSE Connection] Dropped. Attempting reconnection...");
      setMqttStatus("disconnected");
    };

    return () => {
      eventSource.close();
    };
  }, [fetchHistory, isSoundEnabled, reconnectCounter]);

  const triggerReconnect = useCallback(() => {
    setReconnectCounter((prev) => prev + 1);
  }, []);

  // Derived state stats
  const [stats, setStats] = useState<MqttStats>({
    totalAlerts: 0,
    uniquePeopleCount: 0,
    lastDetectionTime: null
  });

  const [unacknowledgedCounts, setUnacknowledgedCounts] = useState({
    blacklist: 0,
    weapon: 0,
    unknown: 0,
    whitelist: 0
  });

  useEffect(() => {
    const uniqueNames = new Set(alerts.filter(a => a.category !== "WEAPON").map(a => a.name.trim().toLowerCase()));
    const lastTime = alerts.length > 0 ? alerts[0].timestamp : null;

    setStats({
      totalAlerts: alerts.length,
      uniquePeopleCount: uniqueNames.size,
      lastDetectionTime: lastTime
    });

    const counts = { blacklist: 0, weapon: 0, unknown: 0, whitelist: 0 };
    alerts.forEach((alert) => {
      if (!alert.acknowledged) {
        if (alert.category === "BLACKLIST") counts.blacklist++;
        else if (alert.category === "WEAPON") counts.weapon++;
        else if (alert.category === "UNKNOWN") counts.unknown++;
        else if (alert.category === "WHITELIST") counts.whitelist++;
      }
    });
    setUnacknowledgedCounts(counts);
  }, [alerts]);

  // Acknowledge single alert
  const acknowledgeAlert = async (id: string) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], acknowledged: true })
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
        );
      }
    } catch (e) {
      console.error("Failed to acknowledge alert:", e);
    }
  };

  // Acknowledge all alerts
  const acknowledgeAll = async () => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledged: true })
      });
      if (res.ok) {
        setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
      }
    } catch (e) {
      console.error("Failed to acknowledge all alerts:", e);
    }
  };

  // Purge all alerts
  const clearDatabase = async () => {
    try {
      const res = await fetch("/api/alerts", { method: "DELETE" });
      if (res.ok) {
        setAlerts([]);
      }
    } catch (e) {
      console.error("Failed to purge alerts history:", e);
    }
  };

  return (
    <MqttContext.Provider
      value={{
        alerts,
        setAlerts,
        mqttStatus,
        stats,
        isSoundEnabled,
        setIsSoundEnabled: handleSetSoundEnabled,
        unacknowledgedCounts,
        triggerReconnect,
        acknowledgeAlert,
        acknowledgeAll,
        clearDatabase
      }}
    >
      {children}
    </MqttContext.Provider>
  );
};

export const useMqttContext = () => {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error("useMqttContext must be used within an MqttProvider");
  }
  return context;
};
