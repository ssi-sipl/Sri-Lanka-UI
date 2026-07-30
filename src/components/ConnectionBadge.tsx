"use client";

import React from "react";
import { Radio } from "lucide-react";

interface ConnectionBadgeProps {
  status: "connected" | "disconnected" | "reconnecting" | string;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ status }) => {
  const config: Record<
    string,
    { label: string; statusClass: string }
  > = {
    connected: {
      label: "SYS ACTIVE",
      statusClass: "connected",
    },
    disconnected: {
      label: "SYS OFFLINE",
      statusClass: "status-off",
    },
    reconnecting: {
      label: "RECONNECTING",
      statusClass: "reconnecting",
    },
  };

  const current = config[status] || config.disconnected;

  return (
    <span className={`status-pill ${current.statusClass}`}>
      <span className="status-dot"></span>
      <span>{current.label}</span>
    </span>
  );
};