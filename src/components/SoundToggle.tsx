"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";

interface SoundToggleProps {
  isSoundEnabled: boolean;
  onToggle: () => void;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({
  isSoundEnabled,
  onToggle,
}) => {
  return (
    <button
      onClick={onToggle}
      className={`nebula-pill-btn ${
        isSoundEnabled ? "btn-audio-active" : "btn-audio-muted"
      }`}
      aria-label={
        isSoundEnabled
          ? "Disable sound notifications"
          : "Enable sound notifications"
      }
    >
      {isSoundEnabled ? (
        <>
          <Volume2 size={14} />
          <span>AUDIO ON</span>
        </>
      ) : (
        <>
          <VolumeX size={14} />
          <span>AUDIO MUTED</span>
        </>
      )}
    </button>
  );
};