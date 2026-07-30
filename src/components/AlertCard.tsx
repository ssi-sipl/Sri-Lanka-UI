"use client";

import React, { useState } from "react";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { useMqttContext, AlertData } from "@/providers/MqttProvider";
import { Camera, Clock, Check, CheckCircle2, Loader2 } from "lucide-react";

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
  const categoryConfig: Record<
    string,
    { label: string; badgeClass: string; cardClass: string }
  > = {
    BLACKLIST: {
      label: "BLACKLISTED",
      badgeClass: "badge-blacklist",
      cardClass: "card-blacklist",
    },
    WEAPON: {
      label: "WEAPON THREAT",
      badgeClass: "badge-weapon",
      cardClass: "card-weapon",
    },
    UNKNOWN: {
      label: "UNKNOWN PERSON",
      badgeClass: "badge-unknown",
      cardClass: "card-unknown",
    },
    WHITELIST: {
      label: "WHITELISTED",
      badgeClass: "badge-whitelist",
      cardClass: "card-whitelist",
    },
  };

  const currentCategory =
    categoryConfig[alert.category] || categoryConfig.UNKNOWN;

  // Format absolute local time
  const formattedAbsoluteTime = () => {
    try {
      const date = new Date(alert.timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  // Score confidence formatting
  const formattedScore = Math.round(alert.score * 100);
  const scoreClass =
    alert.score >= 0.85
      ? "score-high"
      : alert.score >= 0.7
      ? "score-medium"
      : "score-low";

  // Fallback image SVG avatar when base64 is missing
  const defaultSvgAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230e0f14"/><circle cx="50" cy="40" r="20" fill="%2327272a"/><path d="M25 80c0-15 10-25 25-25s25 10 25 25" stroke="%2327272a" stroke-width="4" fill="none"/></svg>`;

  const imageSrc =
    alert.faceImage && alert.faceImage.startsWith("data:")
      ? alert.faceImage
      : alert.faceImage
      ? `data:image/jpeg;base64,${alert.faceImage}`
      : defaultSvgAvatar;

  return (
    <div
      className={`nebula-alert-card ${currentCategory.cardClass} ${
        alert.acknowledged ? "acknowledged" : ""
      }`}
    >
      {/* Alert Face/Weapon Preview Frame */}
      <div className="alert-crop-frame">
        <img
          src={imageSrc}
          alt={alert.category === "WEAPON" ? "Weapon Crop" : "Face Crop"}
          className="alert-crop-img"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultSvgAvatar;
          }}
        />
      </div>

      {/* Alert Metadata */}
      <div className="alert-content">
        <div className="alert-top-row">
          <span className="alert-identity">
            {alert.category === "WEAPON"
              ? alert.name
              : alert.name || "unknown identity"}
          </span>

          <div className="alert-pills-row">
            <span className={`cat-pill ${currentCategory.badgeClass}`}>
              {currentCategory.label}
            </span>
            <span className={`score-pill ${scoreClass}`}>
              {formattedScore}% match
            </span>
          </div>
        </div>

        <div className="alert-meta-row">
          <div className="meta-badge">
            <Camera size={12} className="meta-icon" />
            <span className="meta-text" title={alert.source}>
              {alert.camera?.name || alert.source}
            </span>
          </div>

          <div className="meta-badge">
            <Clock size={12} className="meta-icon" />
            <span className="meta-text">
              {relativeTime}{" "}
              <span className="time-absolute">({formattedAbsoluteTime()})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Acknowledge Button / Indicator */}
      <div className="alert-action-slot">
        {!alert.acknowledged ? (
          <button
            onClick={handleAcknowledge}
            className="nebula-ack-btn"
            disabled={isAcking}
            title="Acknowledge Alert"
            aria-label="Acknowledge Alert"
          >
            {isAcking ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
          </button>
        ) : (
          <div className="nebula-ack-indicator" title="Acknowledged">
            <CheckCircle2 size={18} />
          </div>
        )}
      </div>
    </div>
  );
};