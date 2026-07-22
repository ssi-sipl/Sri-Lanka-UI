"use client";

import React from "react";

interface ConnectionBadgeProps {
  status: "connected" | "disconnected" | "reconnecting";
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ status }) => {
  const config = {
    connected: { text: "SYS ACTIVE", class: "text-green border-green bg-green-dim" },
    disconnected: { text: "SYS OFFLINE", class: "text-red border-red bg-red-dim" },
    reconnecting: { text: "RECONNECTING", class: "text-yellow border-yellow bg-yellow-dim" }
  };

  const current = config[status] || config.disconnected;

  return (
    <div
      className={`monospace monospace-badge font-bold italic animate-enter ${current.class}`}
      style={{
        fontSize: "0.65rem",
        padding: "0.25rem 0.5rem",
        border: "1px solid",
        borderRadius: "4px",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        letterSpacing: "0.03em"
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: "currentColor",
          boxShadow: "0 0 6px currentColor",
          display: "inline-block"
        }}
      ></span>
      {current.text}
    </div>
  );
};
