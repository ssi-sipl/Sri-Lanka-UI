"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Video,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Link2,
  Shield,
  Power,
  Sliders,
} from "lucide-react";

interface CameraItem {
  id: string;
  name: string;
  rtspUrl: string;
  location?: string | null;
  isActive: boolean;
  rulesCount?: number;
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [name, setName] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCameras = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cameras");
      const json = await res.json();
      if (json.success) {
        setCameras(json.data);
      }
    } catch (e) {
      setError("Failed to query stream registry from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const handleRegisterCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rtspUrl) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rtspUrl, location, isActive: true }),
      });
      const json = await res.json();
      if (json.success) {
        setName("");
        setRtspUrl("");
        setLocation("");
        setSuccess(`Stream "${name}" registered successfully!`);
        loadCameras();
      } else {
        setError(json.error || "Failed to create stream configuration.");
      }
    } catch (e) {
      setError("Server connection failure.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/cameras", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setCameras((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c))
        );
      }
    } catch (e) {
      setError("Failed to update active state.");
    }
  };

  const handleDeleteCamera = async (id: string, camName: string) => {
    if (
      !confirm(
        `🚨 WARNING: Deleting camera "${camName}" will also remove all associated rules. Proceed?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/cameras?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        loadCameras();
      } else {
        setError(json.error || "Failed to remove camera.");
      }
    } catch (e) {
      setError("Server connection failure.");
    }
  };

  if (loading) {
    return (
      <div className="nebula-wrapper flex-center">
        <div className="nebula-spotlight"></div>
        <div className="nebula-loader">
          <div className="spinner"></div>
          <p>Querying registered camera streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nebula-wrapper">
      {/* Overhead Spotlight Element (No Gap Top) */}
      <div className="nebula-spotlight"></div>

      <div className="nebula-container">
        {/* Header */}
        <div className="nebula-header">
          <span className="nebula-badge">STREAM CHANNELS</span>
          <h1>Camera Registry</h1>
          <p>Manage active RTSP security video channels and camera streams.</p>
        </div>

        {/* Banners */}
        {error && (
          <div className="nebula-banner banner-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="nebula-banner banner-success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Registration Form Card */}
        <div className="nebula-card margin-bottom-lg">
          <div className="nebula-card-header">
            <div className="nebula-icon-wrap">
              <PlusCircle size={20} />
            </div>
            <div>
              <h2>Register Stream Channel</h2>
              <p>Add a new RTSP camera feed URL to the computer vision pipeline.</p>
            </div>
          </div>

          <form onSubmit={handleRegisterCamera} className="nebula-form-row">
            <div className="nebula-input-group flex-1">
              <label>
                <Camera size={12} /> DISPLAY NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., North Gate Guard"
                className="nebula-input"
                required
              />
            </div>

            <div className="nebula-input-group flex-2">
              <label>
                <Link2 size={12} /> RTSP STREAM URL
              </label>
              <input
                type="text"
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                placeholder="rtsp://192.168.1.50/stream1"
                className="nebula-input"
                required
              />
            </div>

            <div className="nebula-input-group flex-1">
              <label>
                <MapPin size={12} /> LOCATION / NOTES
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Building A, Entrance"
                className="nebula-input"
              />
            </div>

            <button
              type="submit"
              className="nebula-pill-btn btn-primary align-self-end"
              disabled={submitting || !name || !rtspUrl}
            >
              <span>{submitting ? "Adding..." : "Register Stream"}</span>
            </button>
          </form>
        </div>

        {/* Registered Cameras Grid Card */}
        <div className="nebula-card">
          <div className="nebula-card-header justify-between flex-wrap gap-md">
            <div className="flex align-center gap-sm">
              <div className="nebula-icon-wrap">
                <Video size={20} />
              </div>
              <div>
                <h2>Registered Channels</h2>
                <p>{cameras.length} active channels configured</p>
              </div>
            </div>
          </div>

          {cameras.length === 0 ? (
            <div className="nebula-empty-state">
              <Video size={36} className="empty-icon" />
              <h4>NO CHANNELS REGISTERED</h4>
              <p>
                Input RTSP camera details above to register a live video channel.
              </p>
            </div>
          ) : (
            <div className="nebula-camera-grid">
              {cameras.map((cam) => (
                <div
                  key={cam.id}
                  className={`nebula-cam-card ${!cam.isActive ? "cam-disabled" : ""}`}
                >
                  <div className="cam-card-top">
                    <span
                      className={`status-pill ${
                        cam.isActive ? "connected" : "status-off"
                      }`}
                    >
                      <span className="status-dot"></span>
                      {cam.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>

                    <button
                      onClick={() => handleDeleteCamera(cam.id, cam.name)}
                      className="cam-delete-btn"
                      title="Delete stream channel"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="cam-card-body">
                    <h3 className="cam-title">{cam.name}</h3>

                    <div className="cam-details-list">
                      <div className="cam-detail-item">
                        <span className="detail-label">
                          <Link2 size={11} /> RTSP
                        </span>
                        <span className="detail-val text-truncate" title={cam.rtspUrl}>
                          {cam.rtspUrl}
                        </span>
                      </div>

                      <div className="cam-detail-item">
                        <span className="detail-label">
                          <MapPin size={11} /> LOCATION
                        </span>
                        <span className="detail-val">
                          {cam.location || "Unspecified"}
                        </span>
                      </div>

                      <div className="cam-detail-item">
                        <span className="detail-label">
                          <Shield size={11} /> RULES
                        </span>
                        <span className="detail-val highlight">
                          {cam.rulesCount ?? 0} Policies
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="cam-card-actions">
                    <button
                      onClick={() => handleToggleActive(cam.id, cam.isActive)}
                      className={`nebula-pill-btn ${
                        cam.isActive ? "btn-toggle-off" : "btn-toggle-on"
                      }`}
                    >
                      <Power size={13} />
                      <span>{cam.isActive ? "Deactivate" : "Activate"}</span>
                    </button>

                    <Link
                      href={`/cameras/${cam.id}`}
                      className="nebula-pill-btn btn-secondary flex-1"
                    >
                      <Sliders size={13} />
                      <span>Rules</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}