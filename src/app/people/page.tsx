"use client";

import React, { useState, useEffect } from "react";

interface Person {
  id: string;
  name: string;
  notes?: string | null;
  createdAt: string;
}

interface Rule {
  id: string;
  cameraId: string | null;
  personId: string;
  listType: string;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [globalRules, setGlobalRules] = useState<Rule[]>([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch people registry
      const peopleRes = await fetch("/api/people");
      const peopleJson = await peopleRes.json();
      if (peopleJson.success) {
        setPeople(peopleJson.data);
      }

      // 2. Fetch global rules (cameraId is null)
      const rulesRes = await fetch("/api/rules?cameraId=null");
      const rulesJson = await rulesRes.json();
      if (rulesJson.success) {
        setGlobalRules(rulesJson.data);
      }
    } catch (e) {
      setError("Failed to query database registries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim().toLowerCase(), notes })
      });
      const json = await res.json();
      if (json.success) {
        setName("");
        setNotes("");
        setSuccess(`Profile "${name}" created successfully!`);
        loadData();
      } else {
        setError(json.error || "Failed to create person profile.");
      }
    } catch (e) {
      setError("Server connection failure.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncRegistry = async () => {
    setSyncing(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/people/sync");
      const json = await res.json();
      if (json.success) {
        setSuccess(`Synchronization complete! Merged ${json.addedCount} new identities from Python encodings.`);
        loadData();
      } else {
        setError(json.error || "Synchronization request failed.");
      }
    } catch (e) {
      setError("Failed to connect to synchronization API. Make sure Python REST API is running on port 8766.");
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleGlobalBlacklist = async (personId: string, currentRule: Rule | undefined) => {
    setError("");
    try {
      if (currentRule) {
        // Delete global blacklist rule
        const res = await fetch(`/api/rules?id=${currentRule.id}`, {
          method: "DELETE"
        });
        const json = await res.json();
        if (json.success) {
          setGlobalRules((prev) => prev.filter((r) => r.id !== currentRule.id));
        } else {
          setError("Failed to remove global blacklist rule.");
        }
      } else {
        // Add global blacklist rule (cameraId: null)
        const res = await fetch("/api/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cameraId: null,
            personId,
            listType: "BLACKLIST"
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          setGlobalRules((prev) => [...prev, json.data]);
        } else {
          setError(json.error || "Failed to establish global blacklist rule.");
        }
      }
    } catch (e) {
      setError("Server connection failure.");
    }
  };

  const handleDeletePerson = async (id: string, personName: string) => {
    if (!confirm(`🚨 WARNING: Deleting "${personName.toUpperCase()}" will also remove all associated rules. Proceed?`)) return;

    try {
      const res = await fetch(`/api/people?id=${id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        setError(json.error || "Failed to delete identity profile.");
      }
    } catch (e) {
      setError("Server connection failure.");
    }
  };

  if (loading) {
    return (
      <div className="spinner-loader">
        <div className="spinner"></div>
        <p className="monospace text-muted" style={{ fontSize: "0.75rem" }}>Querying identity registry database...</p>
      </div>
    );
  }

  return (
    <div className="people-page-container flex flex-column gap-md animate-enter">
      {/* Page Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">People Database</h1>
          <p className="section-sublabel">Manage registered face profiles and configure global threat blacklists.</p>
        </div>
        
        <div className="feed-actions-bar">
          <button
            onClick={handleSyncRegistry}
            className="btn btn-primary"
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync Python Encodings"}
          </button>
        </div>
      </div>

      {error && <div className="form-error-banner monospace">⚠️ {error}</div>}
      {success && <div className="form-success-banner monospace">✅ {success}</div>}

      {/* Register Person Form */}
      <form onSubmit={handleRegisterPerson} className="bg-glass p-md flex flex-column gap-sm" style={{ padding: "1.25rem" }}>
        <h3 className="font-bold text-cyan" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
          Register Identity Profile
        </h3>
        
        <div className="flex flex-wrap gap-md align-end" style={{ gap: "1rem" }}>
          <div className="filter-input-wrap flex-grow-1" style={{ minWidth: "200px" }}>
            <label className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
              Identity Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Doe"
              className="input-field"
              required
            />
          </div>

          <div className="filter-input-wrap flex-grow-2" style={{ minWidth: "250px" }}>
            <label className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
              Notes / Department
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., IT Security Dept"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !name}
            style={{ height: "36px" }}
          >
            {submitting ? "Adding..." : "Create Profile"}
          </button>
        </div>
      </form>

      {/* Registry Table */}
      <h3 className="section-title text-cyan" style={{ marginTop: "1rem" }}>Identity Database Registry</h3>
      
      {people.length === 0 ? (
        <div className="empty-radar-wrap" style={{ borderStyle: "dashed", padding: "3rem" }}>
          <h4 className="radar-label text-muted">NO IDENTITIES REGISTERED</h4>
          <p className="radar-sublabel" style={{ marginBottom: "1rem" }}>Click "Sync Python Encodings" or add a profile manually.</p>
        </div>
      ) : (
        <div className="table-responsive bg-glass">
          <table className="people-table">
            <thead>
              <tr className="monospace">
                <th>Identity Name</th>
                <th>Notes / Details</th>
                <th className="text-center" style={{ width: "160px" }}>Global Blacklist</th>
                <th className="text-center" style={{ width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => {
                const globalRule = globalRules.find((r) => r.personId === person.id && r.listType === "BLACKLIST");
                return (
                  <tr key={person.id} className="monospace" style={{ background: globalRule ? "rgba(255, 42, 95, 0.02)" : "transparent" }}>
                    <td className="font-bold text-cyan uppercase">{person.name}</td>
                    <td className="text-secondary">{person.notes || <span className="text-muted italic">No details added</span>}</td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={!!globalRule}
                        onChange={() => handleToggleGlobalBlacklist(person.id, globalRule)}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                        title="Enforce global blacklist rule"
                      />
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleDeletePerson(person.id, person.name)}
                        className="btn border-button hover-bg-red"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.65rem", borderColor: "rgba(255, 42, 95, 0.3)" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
