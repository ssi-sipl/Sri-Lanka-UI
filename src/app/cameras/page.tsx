"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Camera {
  id: string;
  name: string;
  rtspUrl: string;
  location?: string | null;
  isActive: boolean;
  rulesCount?: number;
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
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
        body: JSON.stringify({ name, rtspUrl, location, isActive: true })
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
        body: JSON.stringify({ id, isActive: !currentStatus })
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
    if (!confirm(`🚨 WARNING: Deleting camera "${camName}" will also remove all associated rules. Proceed?`)) return;

    try {
      const res = await fetch(`/api/cameras?id=${id}`, {
        method: "DELETE"
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
      <div className="spinner-loader">
        <div className="spinner"></div>
        <p className="monospace text-muted" style={{ fontSize: "0.75rem" }}>Querying registered camera streams...</p>
      </div>
    );
  }

  return (
    <div className="cameras-page-container flex flex-column gap-md animate-enter">
      {/* Page Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Camera Registry</h1>
          <p className="section-sublabel">Manage active RTSP security video channels and streams.</p>
        </div>
      </div>

      {error && <div className="form-error-banner monospace">⚠️ {error}</div>}
      {success && <div className="form-success-banner monospace">✅ {success}</div>}

      {/* Add Camera Form */}
      <form onSubmit={handleRegisterCamera} className="bg-glass p-md flex flex-column gap-sm" style={{ padding: "1.25rem" }}>
        <h3 className="font-bold text-cyan" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
          Register Stream Channel
        </h3>
        
        <div className="flex flex-wrap gap-md align-end" style={{ gap: "1rem" }}>
          <div className="filter-input-wrap flex-grow-1" style={{ minWidth: "180px" }}>
            <label className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., North Gate Guard"
              className="input-field"
              required
            />
          </div>

          <div className="filter-input-wrap flex-grow-2" style={{ minWidth: "250px" }}>
            <label className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
              RTSP stream URL
            </label>
            <input
              type="text"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              placeholder="rtsp://192.168.1.50/stream1"
              className="input-field"
              required
            />
          </div>

          <div className="filter-input-wrap flex-grow-1" style={{ minWidth: "150px" }}>
            <label className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
              Location / Notes
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Building A, Entrance"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !name || !rtspUrl}
            style={{ height: "36px" }}
          >
            {submitting ? "Adding..." : "Register Stream"}
          </button>
        </div>
      </form>

      {/* Grid of registered Cameras */}
      <h3 className="section-title text-cyan" style={{ marginTop: "1rem" }}>Registered Channels</h3>
      
      {cameras.length === 0 ? (
        <div className="empty-radar-wrap" style={{ borderStyle: "dashed", padding: "3rem" }}>
          <h4 className="radar-label text-muted">NO CHANNELS REGISTERED</h4>
          <p className="radar-sublabel">Input details above to register a live video channel.</p>
        </div>
      ) : (
        <div className="cameras-detail-grid">
          {cameras.map((cam) => (
            <div key={cam.id} className={`camera-detail-card bg-glass ${!cam.isActive ? "disabled-card" : ""}`}>
              <div className="card-top">
                <div className="title-section">
                  <span
                    className={`monospace font-bold italic`}
                    style={{
                      fontSize: "0.6rem",
                      padding: "0.15rem 0.35rem",
                      borderRadius: "3px",
                      border: "1px solid",
                      color: cam.isActive ? "var(--accent-green)" : "var(--accent-red)",
                      borderColor: cam.isActive ? "var(--accent-green)" : "var(--accent-red)",
                      background: cam.isActive ? "var(--accent-green-dim)" : "var(--accent-red-dim)"
                    }}
                  >
                    {cam.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <span className="cam-name text-cyan font-bold">{cam.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteCamera(cam.id, cam.name)}
                  className="delete-card-btn"
                  title="Delete stream"
                  aria-label="Delete stream"
                >
                  &times;
                </button>
              </div>

              <div className="card-middle monospace">
                <div className="detail-row">
                  <span className="label">RTSP LINK:</span>
                  <span className="val" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "160px" }} title={cam.rtspUrl}>
                    {cam.rtspUrl}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">LOCATION:</span>
                  <span className="val">{cam.location || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">RULES COUNT:</span>
                  <span className="val">{cam.rulesCount ?? 0}</span>
                </div>
              </div>

              <div className="card-bottom-actions">
                <button
                  onClick={() => handleToggleActive(cam.id, cam.isActive)}
                  className={`btn border-button`}
                  style={{
                    fontSize: "0.65rem",
                    padding: "0.35rem 0.65rem",
                    borderColor: cam.isActive ? "var(--accent-red)" : "var(--accent-green)",
                    color: cam.isActive ? "var(--accent-red)" : "var(--accent-green)",
                    background: cam.isActive ? "var(--accent-red-dim)" : "var(--accent-green-dim)"
                  }}
                >
                  {cam.isActive ? "Deactivate" : "Activate"}
                </button>
                <Link
                  href={`/cameras/${cam.id}`}
                  className="btn btn-primary"
                  style={{ fontSize: "0.65rem", padding: "0.35rem 0.65rem" }}
                >
                  Configure Rules
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
