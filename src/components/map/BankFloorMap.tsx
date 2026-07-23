"use client";

import React, { useState, useEffect } from "react";
import { useMqttContext, AlertData } from "@/providers/MqttProvider";
import { MapCameraNode } from "./MapTypes";
import { AlertCard } from "../AlertCard";

export const BankFloorMap: React.FC = () => {
  const { alerts } = useMqttContext();
  const [selectedCam, setSelectedCam] = useState<MapCameraNode | null>(null);
  const [activeNodes, setActiveNodes] = useState<MapCameraNode[]>([]);

  // 4 Default demo camera nodes positioned absolutely on our 2D floor map coordinate system
  const defaultNodes: MapCameraNode[] = [
    {
      id: "cam-entrance",
      name: "Entrance CCTV",
      location: "Main Entrance Vestibule",
      x: 15,
      y: 75,
      rtspUrl: "rtsp://192.168.1.100/stream",
      status: "ONLINE",
    },
    {
      id: "cam-lobby",
      name: "Lobby Security Dome",
      location: "Customer Waiting Lobby",
      x: 45,
      y: 50,
      rtspUrl: "rtsp://192.168.1.101/stream",
      status: "ONLINE",
    },
    {
      id: "cam-tellers",
      name: "Tellers Counter Cam",
      location: "Teller Transaction Desks",
      x: 75,
      y: 35,
      rtspUrl: "rtsp://192.168.1.102/stream",
      status: "ONLINE",
    },
    {
      id: "cam-vault",
      name: "Safe Vault Internal",
      location: "Cash Vault Room",
      x: 82,
      y: 75,
      rtspUrl: "rtsp://192.168.1.103/stream",
      status: "ONLINE",
    },
  ];

  // Dynamically determine camera nodes status based on recent alerts in the stream
  useEffect(() => {
    const updated = defaultNodes.map((node) => {
      // Find if there is a threat (WEAPON or BLACKLIST) in the last 20 seconds for this camera source
      const hasRecentThreat = alerts.some((alert) => {
        if (alert.source !== node.rtspUrl) return false;
        const timeElapsed = Date.now() - new Date(alert.timestamp).getTime();
        const isThreat = alert.category === "BLACKLIST" || alert.category === "WEAPON";
        return isThreat && timeElapsed < 20000; // 20 seconds window
      });

      return {
        ...node,
        status: hasRecentThreat ? ("THREAT" as const) : ("ONLINE" as const),
      };
    });

    setActiveNodes(updated);

    // Keep the details panel details in sync if it is open
    if (selectedCam) {
      const currentSelected = updated.find((n) => n.id === selectedCam.id);
      if (currentSelected) {
        setSelectedCam(currentSelected);
      }
    }
  }, [alerts]);

  // Filter alerts specifically matching the currently focused camera source
  const getCameraDetections = (rtspUrl: string) => {
    return alerts.filter((a) => a.source === rtspUrl);
  };

  return (
    <div className="bank-map-wrapper flex" style={{ minHeight: "600px", position: "relative" }}>
      {/* 2D Floor Plan SVG Layout Panel */}
      <div className="map-canvas-container flex-grow relative bg-glass" style={{ minHeight: "560px", overflow: "hidden", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
        
        {/* SVG Grid Vector Floor Plan */}
        <svg
          viewBox="0 0 1000 600"
          className="floor-plan-svg"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#000000",
            backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          {/* Outer Border Outlines */}
          <rect x="20" y="20" width="960" height="560" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          
          {/* Main Lobby Area Grid */}
          <rect x="250" y="80" width="500" height="440" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.04)" strokeDasharray="5,5" />
          
          {/* Cash Vault Room Vector Walls */}
          <rect x="750" y="280" width="210" height="240" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <line x1="750" y1="420" x2="790" y2="420" stroke="#000000" strokeWidth="3" /> {/* Vault Entry Door Gap */}
          <text x="855" y="405" fill="rgba(255,255,255,0.3)" fontSize="14" fontWeight="bold" textAnchor="middle">CASH VAULT</text>

          {/* Teller Counter Vector Partition */}
          <line x1="680" y1="80" x2="680" y2="280" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <line x1="500" y1="280" x2="680" y2="280" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <text x="590" y="185" fill="rgba(255,255,255,0.3)" fontSize="14" fontWeight="bold" textAnchor="middle">TELLER COUNTERS</text>

          {/* ATM Vestibule (Left Entrance) */}
          <rect x="40" y="280" width="210" height="240" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <text x="145" y="405" fill="rgba(255,255,255,0.3)" fontSize="14" fontWeight="bold" textAnchor="middle">ATM VESTIBULE</text>

          {/* Customer Waiting Lobby Area */}
          <text x="500" y="440" fill="rgba(255,255,255,0.2)" fontSize="16" fontWeight="bold" textAnchor="middle">MAIN CUSTOMER LOBBY</text>

          {/* Main Entrance (Front Vestibule) */}
          <line x1="40" y1="80" x2="250" y2="80" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <line x1="250" y1="80" x2="250" y2="220" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <text x="145" y="145" fill="rgba(255,255,255,0.3)" fontSize="14" fontWeight="bold" textAnchor="middle">ENTRANCE VESTIBULE</text>
        </svg>

        {/* Camera Hotspot Pins Overlay */}
        {activeNodes.map((node) => {
          const isSelected = selectedCam?.id === node.id;
          const statusClass = node.status === "THREAT" ? "pulse-threat" : "pulse-online";
          const iconColor = node.status === "THREAT" ? "var(--accent-red)" : "var(--accent-cyan)";

          return (
            <div
              key={node.id}
              className={`camera-hotspot-pin ${isSelected ? "focused" : ""}`}
              style={{
                position: "absolute",
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
                cursor: "pointer",
                zIndex: 10,
              }}
              onClick={() => setSelectedCam(isSelected ? null : node)}
            >
              {/* Dynamic Status Pulsing Glow Ring */}
              <div className={`hotspot-ring ${statusClass}`}></div>

              {/* Central Camera Marker */}
              <div
                className="hotspot-center flex align-center justify-center"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(10, 10, 14, 0.9)",
                  border: `2px solid ${iconColor}`,
                  boxShadow: `0 0 12px ${iconColor}`,
                  transition: "all 0.25s ease",
                }}
              >
                {/* SVG Camera Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.0}
                  stroke={iconColor}
                  style={{ width: "16px", height: "16px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </div>

              {/* Tooltip Label */}
              <div
                className="hotspot-label bg-glass font-bold"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginTop: "8px",
                  padding: "0.2rem 0.5rem",
                  fontSize: "0.65rem",
                  color: "#ffffff",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                {node.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-Drawer Details Panel for Selected Camera */}
      <div
        className={`camera-details-drawer bg-glass ${selectedCam ? "open" : ""}`}
        style={{
          width: selectedCam ? "380px" : "0",
          opacity: selectedCam ? "1" : "0",
          borderLeft: selectedCam ? "1px solid var(--border-color)" : "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "600px",
        }}
      >
        {selectedCam && (
          <div className="drawer-inner flex flex-column gap-md" style={{ padding: "1.25rem", width: "380px", flexShrink: 0, height: "100%", overflowY: "auto" }}>
            {/* Header */}
            <div className="flex justify-between align-center" style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
              <div>
                <h3 className="section-title text-cyan" style={{ fontSize: "1.1rem" }}>{selectedCam.name}</h3>
                <span className="text-muted" style={{ fontSize: "0.75rem" }}>{selectedCam.location}</span>
              </div>
              <button
                onClick={() => setSelectedCam(null)}
                className="btn border-button"
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              >
                CLOSE
              </button>
            </div>

            {/* Video Feed Simulation Box */}
            <div className="mock-feed-container relative" style={{ height: "180px", backgroundColor: "#020202", border: "1px solid var(--border-subtle)", borderRadius: "4px", overflow: "hidden" }}>
              {/* Scanlines Effect Overlay */}
              <div className="cctv-overlay-grid"></div>
              
              {/* Video Overlay Specs */}
              <div className="cctv-meta-overlay font-bold" style={{ position: "absolute", top: "10px", left: "10px", fontSize: "0.65rem", color: "#34c759", textShadow: "0 0 4px #34c759", zIndex: 5 }}>
                <div>LIVE FEED // MON-0{selectedCam.id.replace("cam-", "")}</div>
                <div>RTSP: {selectedCam.rtspUrl.replace("rtsp://", "")}</div>
              </div>

              <div className="cctv-rec-dot font-bold" style={{ position: "absolute", top: "10px", right: "10px", fontSize: "0.65rem", color: "#ff3b30", textShadow: "0 0 4px #ff3b30", display: "flex", alignItems: "center", gap: "4px", zIndex: 5 }}>
                <span className="rec-pulse-dot" style={{ width: "6px", height: "6px", backgroundColor: "#ff3b30", borderRadius: "50%" }}></span>
                REC
              </div>

              {/* Simulated Camera Video Noise */}
              <div className="cctv-noise-container flex align-center justify-center" style={{ width: "100%", height: "100%" }}>
                {selectedCam.status === "THREAT" ? (
                  <div className="text-red font-bold animate-pulse" style={{ fontSize: "0.9rem", zIndex: 5, letterSpacing: "1px" }}>
                    ⚠️ SYSTEM BREACH DETECTED
                  </div>
                ) : (
                  <div className="text-cyan font-bold" style={{ fontSize: "0.8rem", opacity: 0.5, zIndex: 5 }}>
                    MONITORING STREAM ACTIVE
                  </div>
                )}
              </div>
            </div>

            {/* Camera Metrics */}
            <div className="metrics-summary bg-glass" style={{ padding: "0.75rem", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
              <div className="flex justify-between font-bold" style={{ fontSize: "0.75rem", color: "#ffffff" }}>
                <span>STREAM HEALTH:</span>
                <span style={{ color: selectedCam.status === "THREAT" ? "var(--accent-red)" : "var(--accent-green)" }}>
                  {selectedCam.status === "THREAT" ? "CRITICAL BREACH" : "100% ONLINE"}
                </span>
              </div>
              <div className="flex justify-between font-bold" style={{ fontSize: "0.75rem", color: "#ffffff", marginTop: "0.5rem" }}>
                <span>TOTAL LOGS:</span>
                <span>{getCameraDetections(selectedCam.rtspUrl).length} detections</span>
              </div>
            </div>

            {/* Recent Camera Logs */}
            <div className="recent-logs-section flex flex-column gap-sm" style={{ flexGrow: 1 }}>
              <h4 className="section-title text-cyan" style={{ fontSize: "0.85rem" }}>CAMERA EVENTS LOG</h4>
              <div className="drawer-detections-list scrollable-area" style={{ overflowY: "auto", maxHeight: "190px" }}>
                {getCameraDetections(selectedCam.rtspUrl).length === 0 ? (
                  <div className="text-muted text-center" style={{ fontSize: "0.75rem", padding: "1.5rem" }}>
                    No alerts received on this stream yet.
                  </div>
                ) : (
                  <div className="flex flex-column gap-sm">
                    {getCameraDetections(selectedCam.rtspUrl).map((alert, idx) => (
                      <div key={alert.id || idx} style={{ transform: "scale(0.95)", transformOrigin: "top left" }}>
                        <AlertCard alert={alert} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
