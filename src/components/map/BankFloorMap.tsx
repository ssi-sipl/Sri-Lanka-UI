"use client";

import React, { useState, useEffect } from "react";
import { useMqttContext } from "@/providers/MqttProvider";
import { MapCameraNode } from "./MapTypes";

export const BankFloorMap: React.FC = () => {
  const { alerts } = useMqttContext();
  const [baseNodes, setBaseNodes] = useState<MapCameraNode[]>([
    {
      id: "cam-entrance",
      name: "Entrance CCTV",
      location: "Main Entrance Door",
      x: 50.0,
      y: 88.0,
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69:554/snl/live/1/1",
      status: "ONLINE",
    },
    {
      id: "cam-lobby",
      name: "Lobby Security Dome",
      location: "Waiting Lounge Area",
      x: 12.0,
      y: 78.0,
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69:554/snl/live/1/1",
      status: "ONLINE",
    },
    {
      id: "cam-tellers",
      name: "Tellers Counter Cam",
      location: "Main Banking Hall",
      x: 20.0,
      y: 52.0,
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69:554/snl/live/1/1",
      status: "ONLINE",
    },
    {
      id: "cam-vault",
      name: "Safe Vault Internal",
      location: "Cash Vault Room",
      x: 85.0,
      y: 24.0,
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69:554/snl/live/1/1",
      status: "ONLINE",
    },
  ]);
  const [activeNodes, setActiveNodes] = useState<MapCameraNode[]>([]);

  // 1. On component load, fetch any custom cameras registered in the database via the API
  useEffect(() => {
    const fetchDbCameras = async () => {
      try {
        const res = await fetch("/api/cameras");
        const json = await res.json();
        if (json.success && json.data) {
          const dbCams = json.data as { location: string; rtspUrl: string }[];
          
          setBaseNodes((prevNodes) =>
            prevNodes.map((node) => {
              // Look for a camera in the database whose location matches this node's location description
              const match = dbCams.find(
                (c) => c.location && c.location.toLowerCase().trim() === node.location.toLowerCase().trim()
              );
              if (match) {
                return { ...node, rtspUrl: match.rtspUrl };
              }
              return node;
            })
          );
        }
      } catch (err) {
        console.error("⚠️ [MAP] Failed to fetch cameras from database API:", err);
      }
    };

    fetchDbCameras();
  }, []);

  // 2. Dynamically determine camera node status based on incoming real-time alerts stream
  useEffect(() => {
    const updated = baseNodes.map((node) => {
      // Find if there is a threat (WEAPON or BLACKLIST) in the last 20 seconds for this camera source URL
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
  }, [baseNodes, alerts]);

  return (
    <div className="bank-map-wrapper" style={{ minHeight: "560px", position: "relative", width: "100%" }}>
      {/* 2D Floor Plan Layout Panel */}
      <div 
        className="map-canvas-container relative bg-glass" 
        style={{ 
          minHeight: "560px", 
          overflow: "hidden", 
          border: "1px solid var(--border-color)", 
          borderRadius: "8px",
          backgroundColor: "#030303",
          width: "100%"
        }}
      >
        {/* Background Blueprint Image */}
        <img 
          src="/bank_floor_plan.jpg" 
          alt="Bank Floor Plan Flat 2D Render" 
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.90,
            userSelect: "none"
          }}
        />

        {/* Camera Hotspot Pins Overlay (Click to launch native player) */}
        {activeNodes.map((node) => {
          const statusClass = node.status === "THREAT" ? "pulse-threat" : "pulse-online";
          const iconColor = node.status === "THREAT" ? "var(--accent-red)" : "var(--accent-cyan)";

          return (
            <div
              key={node.id}
              className="camera-hotspot-pin"
              style={{
                position: "absolute",
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
              onClick={() => { window.location.href = node.rtspUrl; }}
            >
              {/* Dynamic Status Pulsing Glow Ring */}
              <div className={`hotspot-ring ${statusClass}`}></div>

              {/* Central Camera Marker */}
              <div
                className="hotspot-center"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(10, 10, 14, 0.95)",
                  border: `2px solid ${iconColor}`,
                  boxShadow: `0 0 12px ${iconColor}`,
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
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
    </div>
  );
};
