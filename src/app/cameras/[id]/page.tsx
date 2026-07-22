"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { PersonListManager } from "@/components/cameras/PersonListManager";

interface Camera {
  id: string;
  name: string;
  rtspUrl: string;
  location?: string | null;
  isActive: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CameraDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const cameraId = resolvedParams.id;

  const [camera, setCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCamera = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/cameras");
        const json = await res.json();
        if (json.success && json.data) {
          const match = json.data.find((c: Camera) => c.id === cameraId);
          if (match) {
            setCamera(match);
          } else {
            setError("Stream configuration not found in registry.");
          }
        }
      } catch (e) {
        setError("Failed to query camera registry.");
      } finally {
        setLoading(false);
      }
    };

    fetchCamera();
  }, [cameraId]);

  if (loading) {
    return (
      <div className="spinner-loader">
        <div className="spinner"></div>
        <p className="monospace text-muted" style={{ fontSize: "0.75rem" }}>Querying camera details...</p>
      </div>
    );
  }

  if (error || !camera) {
    return (
      <div className="cameras-page-container flex flex-column gap-md animate-enter">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Detailed Error</h1>
        </div>
        <div className="form-error-banner monospace">
          {error || "Stream configurations not resolved."}
        </div>
        <Link href="/cameras" className="btn border-button align-self-start" style={{ width: "fit-content" }}>
          Back to Camera List
        </Link>
      </div>
    );
  }

  return (
    <div className="cameras-page-container flex flex-column gap-md animate-enter">
      {/* Page Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Configure Stream</h1>
          <p className="section-sublabel">Define per-camera detection rules for Blacklists and Whitelists.</p>
        </div>
        
        <div className="feed-actions-bar">
          <Link href="/cameras" className="btn border-button">
            Back to Cameras
          </Link>
        </div>
      </div>

      {/* Stream Info Cards */}
      <div className="bg-glass p-md flex flex-column gap-sm" style={{ padding: "1.25rem" }}>
        <h3 className="monospace font-bold text-cyan" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
          Channel Information
        </h3>
        <div className="monospace" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", fontSize: "0.75rem" }}>
          <div>
            <span className="text-muted">Channel Name: </span>
            <span className="text-cyan font-bold">{camera.name}</span>
          </div>
          <div>
            <span className="text-muted">RTSP URL: </span>
            <span className="text-secondary" style={{ wordBreak: "break-all" }}>{camera.rtspUrl}</span>
          </div>
          <div>
            <span className="text-muted">Location Notes: </span>
            <span className="text-secondary">{camera.location || "N/A"}</span>
          </div>
          <div>
            <span className="text-muted">Channel Status: </span>
            <span className={camera.isActive ? "text-green" : "text-red"}>
              {camera.isActive ? "ACTIVE & SCANNING" : "DISABLED"}
            </span>
          </div>
        </div>
      </div>

      {/* Rules Manager Dual Pane */}
      <div className="bg-glass p-md" style={{ padding: "1.25rem" }}>
        <PersonListManager cameraId={camera.id} />
      </div>
    </div>
  );
}
