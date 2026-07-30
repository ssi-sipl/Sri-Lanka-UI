"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  RefreshCw,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Search,
  Check,
} from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
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
        body: JSON.stringify({ name: name.trim().toLowerCase(), notes }),
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
        setSuccess(
          `Synchronization complete! Merged ${json.addedCount} new identities from Python encodings.`
        );
        loadData();
      } else {
        setError(json.error || "Synchronization request failed.");
      }
    } catch (e) {
      setError(
        "Failed to connect to synchronization API. Make sure Python REST API is running on port 8766."
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleGlobalBlacklist = async (
    personId: string,
    currentRule: Rule | undefined
  ) => {
    setError("");
    try {
      if (currentRule) {
        // Delete global blacklist rule
        const res = await fetch(`/api/rules?id=${currentRule.id}`, {
          method: "DELETE",
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
            listType: "BLACKLIST",
          }),
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
    if (
      !confirm(
        `🚨 WARNING: Deleting "${personName.toUpperCase()}" will also remove all associated rules. Proceed?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/people?id=${id}`, {
        method: "DELETE",
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

  const filteredPeople = people.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="nebula-wrapper flex-center">
        <div className="nebula-spotlight"></div>
        <div className="nebula-loader">
          <div className="spinner"></div>
          <p>Querying identity registry database...</p>
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
          <span className="nebula-badge">IDENTITY MANAGEMENT</span>
          <h1>People Database</h1>
          <p>
            Manage registered face profiles, sync encodings, and configure global threat blacklists.
          </p>

          <div className="nebula-header-actions">
            <button
              onClick={handleSyncRegistry}
              className="nebula-pill-btn btn-primary"
              disabled={syncing}
            >
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              <span>{syncing ? "Syncing..." : "Sync Python Encodings"}</span>
            </button>
          </div>
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

        {/* Section 1: Registration Form Card */}
        <div className="nebula-card margin-bottom-lg">
          <div className="nebula-card-header">
            <div className="nebula-icon-wrap">
              <UserPlus size={20} />
            </div>
            <div>
              <h2>Register Identity Profile</h2>
              <p>Add new target profiles manually to the computer vision index.</p>
            </div>
          </div>

          <form onSubmit={handleRegisterPerson} className="nebula-form-row">
            <div className="nebula-input-group flex-1">
              <label>
                <User size={12} /> IDENTITY NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
                className="nebula-input"
                required
              />
            </div>

            <div className="nebula-input-group flex-2">
              <label>
                <FileText size={12} /> NOTES / DEPARTMENT
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., IT Security Dept"
                className="nebula-input"
              />
            </div>

            <button
              type="submit"
              className="nebula-pill-btn btn-primary align-self-end"
              disabled={submitting || !name}
            >
              <span>{submitting ? "Adding..." : "Create Profile"}</span>
            </button>
          </form>
        </div>

        {/* Section 2: Database Registry Table Card */}
        <div className="nebula-card">
          <div className="nebula-card-header justify-between flex-wrap gap-md">
            <div className="flex align-center gap-sm">
              <div className="nebula-icon-wrap">
                <Users size={20} />
              </div>
              <div>
                <h2>Identity Database Registry</h2>
                <p>{filteredPeople.length} profiles registered in system</p>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="search-pill-input">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search profiles or notes..."
              />
            </div>
          </div>

          {filteredPeople.length === 0 ? (
            <div className="nebula-empty-state">
              <ShieldAlert size={36} className="empty-icon" />
              <h4>NO IDENTITIES FOUND</h4>
              <p>
                Click "Sync Python Encodings" or register a profile manually using the form above.
              </p>
            </div>
          ) : (
            <div className="nebula-table-wrapper">
              <table className="nebula-table">
                <thead>
                  <tr>
                    <th>IDENTITY NAME</th>
                    <th>NOTES / DETAILS</th>
                    <th className="text-center">GLOBAL BLACKLIST</th>
                    <th className="text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPeople.map((person) => {
                    const globalRule = globalRules.find(
                      (r) => r.personId === person.id && r.listType === "BLACKLIST"
                    );
                    const isBlacklisted = !!globalRule;

                    return (
                      <tr
                        key={person.id}
                        className={isBlacklisted ? "row-blacklisted" : ""}
                      >
                        <td>
                          <div className="identity-cell">
                            <span className="identity-avatar">
                              {person.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="identity-name">{person.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="identity-notes">
                            {person.notes || <span className="dim-text">No details added</span>}
                          </span>
                        </td>
                        <td className="text-center">
                          <label className="nebula-checkbox-container">
                            <input
                              type="checkbox"
                              checked={isBlacklisted}
                              onChange={() =>
                                handleToggleGlobalBlacklist(person.id, globalRule)
                              }
                            />
                            <span className="checkbox-custom">
                              {isBlacklisted && <Check size={12} />}
                            </span>
                          </label>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleDeletePerson(person.id, person.name)}
                            className="nebula-pill-btn btn-danger-sm"
                            title="Delete profile"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
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
      </div>
    </div>
  );
}