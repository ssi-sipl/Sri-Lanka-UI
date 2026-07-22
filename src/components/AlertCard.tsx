"use client";

import React, { useState } from "react";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { useMqttContext, AlertData } from "@/providers/MqttProvider";

interface AlertCardProps {
  alert: AlertData;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const { acknowledgeAlert } = useMqttContext();
  const [isAcking, setIsAcking] = useState(false);
  
  // Custom hook that updates relative time dynamically
  const relativeTime = useRelativeTime(alert.timestamp);

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (alert.acknowledged || isAcking) return;
    setIsAcking(true);
    try {
      if (alert.id) {
        await acknowledgeAlert(alert.id);
      }
    } finally {
      setIsAcking(false);
    }
  };

  // Convert categories to visual styling configurations
  const categoryConfig = {
    BLACKLIST: { label: "BLACKLISTED", class: "alert-card-blacklist", badge: "category-blacklist" },
    WEAPON: { label: "WEAPON THREAT", class: "alert-card-weapon", badge: "category-weapon" },
    UNKNOWN: { label: "UNKNOWN PERSON", class: "alert-card-unknown", badge: "category-unknown" },
    WHITELIST: { label: "WHITELISTED", class: "alert-card-whitelist", badge: "category-whitelist" }
  };

  const currentCategory = categoryConfig[alert.category] || categoryConfig.UNKNOWN;

  // Format absolute local time
  const formattedAbsoluteTime = () => {
    try {
      const date = new Date(alert.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return "";
    }
  };

  // Score confidence formatting
  const formattedScore = Math.round(alert.score * 100);
  const scoreClass = alert.score >= 0.85 ? "score-high" : alert.score >= 0.70 ? "score-medium" : "score-low";

  // Fallback image path SVG code when base64 is missing
  const defaultSvgAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2318181b"/><circle cx="50" cy="40" r="20" fill="%2352525b"/><path d="M25 80c0-15 10-25 25-25s25 10 25 25" stroke="%2352525b" stroke-width="4" fill="none"/></svg>`;

  const imageSrc = alert.faceImage && alert.faceImage.startsWith("data:")
    ? alert.faceImage
    : alert.faceImage
      ? `data:image/jpeg;base64,${alert.faceImage}`
      : defaultSvgAvatar;

  return (
    <div className={`alert-card animate-enter ${currentCategory.class} ${alert.acknowledged ? "acknowledged" : ""}`}>
      {/* Alert Crop Preview Frame */}
      <div className="alert-image-container">
        <img
          src={imageSrc}
          alt={alert.category === "WEAPON" ? "Weapon Crop" : "Face Crop"}
          className="alert-face-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultSvgAvatar;
          }}
        />
      </div>

      {/* Alert Metadata Fields */}
      <div className="alert-details">
        <div className="alert-details-row">
          <div className="alert-name text-cyan uppercase font-bold">
            {alert.category === "WEAPON" ? alert.name : alert.name || "unknown identity"}
          </div>
          <div className="alert-badges">
            <span className={`category-badge ${currentCategory.badge}`}>
              {currentCategory.label}
            </span>
            <span className={`alert-score-badge monospace ${scoreClass}`}>
              {formattedScore}% match
            </span>
          </div>
        </div>

        <div className="alert-details-meta">
          <div className="alert-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="meta-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <span className="meta-text text-muted" title={alert.source}>
              {alert.camera?.name || alert.source}
            </span>
          </div>
          <div className="alert-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="meta-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="meta-text">
              {relativeTime} <span className="text-muted monospace">({formattedAbsoluteTime()})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Acknowledge Check button */}
      {!alert.acknowledged ? (
        <button
          onClick={handleAcknowledge}
          className="ack-button"
          disabled={isAcking}
          title="Acknowledge Alert"
          aria-label="Acknowledge Alert"
        >
          {isAcking ? (
            <div className="spinner" style={{ width: "12px", height: "12px", borderWidth: "1px" }}></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: "12px", height: "12px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
        </button>
      ) : (
        <div className="ack-indicator" title="Acknowledged">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: "16px", height: "16px" }}>
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.748-5.25Z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};
