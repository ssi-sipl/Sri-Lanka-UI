"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { PersonListManager } from "@/components/cameras/PersonListManager";
import {
  ArrowLeft,
  Camera,
  Link2,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Sliders,
} from "lucide-react";

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
      <div className="nebula-wrapper flex-center">
        <div className="nebula-spotlight"></div>
        <div className="nebula-loader">
          <div className="spinner"></div>
          <p>Querying stream details...</p>
        </div>
      </div>
    );
  }

  if (error || !camera) {
    return (
      <div className="nebula-wrapper">
        <div className="nebula-spotlight"></div>
        <div className="nebula-container">
          <div className="nebula-header">
            <span className="nebula-badge">ERROR</span>
            <h1>Detailed Error</h1>
          </div>

          <div className="nebula-banner banner-error margin-bottom-lg">
            <AlertTriangle size={16} />
            <span>{error || "Stream configurations not resolved."}</span>
          </div>

          <Link href="/cameras" className="nebula-pill-btn btn-secondary">
            <ArrowLeft size={15} />
            <span>Back to Camera List</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="nebula-wrapper">
      {/* Overhead Spotlight Element (Flush Top) */}
      <div className="nebula-spotlight"></div>

      <div className="nebula-container">
        {/* Header */}
        <div className="nebula-header">
          <span className="nebula-badge">CHANNEL CONFIGURATION</span>
          <h1>Configure Stream</h1>
          <p>Define per-camera detection rules for Blacklists and Whitelists.</p>

          <div className="nebula-header-actions">
            <Link href="/cameras" className="nebula-pill-btn btn-secondary">
              <ArrowLeft size={15} />
              <span>Back to Cameras</span>
            </Link>
          </div>
        </div>

        {/* Channel Details Card */}
        <div className="nebula-card margin-bottom-lg">
          <div className="nebula-card-header">
            <div className="nebula-icon-wrap">
              <Camera size={20} />
            </div>
            <div>
              <h2>{camera.name}</h2>
              <p>Stream Telemetry & Connection Status</p>
            </div>
          </div>

          <div className="nebula-stats-list detail-grid">
            <div className="nebula-stat-item">
              <span className="stat-label">
                <Camera size={12} /> CHANNEL NAME
              </span>
              <span className="stat-value highlight">{camera.name}</span>
            </div>

            <div className="nebula-stat-item">
              <span className="stat-label">
                <Link2 size={12} /> RTSP URL
              </span>
              <span className="stat-value text-truncate" title={camera.rtspUrl}>
                {camera.rtspUrl}
              </span>
            </div>

            <div className="nebula-stat-item">
              <span className="stat-label">
                <MapPin size={12} /> LOCATION
              </span>
              <span className="stat-value">{camera.location || "Unspecified"}</span>
            </div>

            <div className="nebula-stat-item">
              <span className="stat-label">
                <ShieldCheck size={12} /> CHANNEL STATUS
              </span>
              <span
                className={`status-pill ${
                  camera.isActive ? "connected" : "status-off"
                }`}
              >
                <span className="status-dot"></span>
                {camera.isActive ? "ACTIVE & SCANNING" : "DISABLED"}
              </span>
            </div>
          </div>
        </div>

        {/* Rules Manager Dual Pane Card */}
        <div className="nebula-card">
          <div className="nebula-card-header">
            <div className="nebula-icon-wrap">
              <Sliders size={20} />
            </div>
            <div>
              <h2>Detection Rule Policies</h2>
              <p>Assign target identity groups to this specific camera stream.</p>
            </div>
          </div>

          <div className="nebula-manager-wrapper">
            <PersonListManager cameraId={camera.id} />
          </div>
        </div>
      </div>
    </div>
  );
}