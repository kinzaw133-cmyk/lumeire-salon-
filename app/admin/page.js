"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Clock,
  Users,
  Coins,
  Search,
  Trash2,
  Phone,
  Eye,
  Layers,
  CheckCircle2,
  History,
  AlertCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  Info,
  Copy,
  Check,
} from "lucide-react";
import ThemeSwitcher from "../../components/ThemeSwitcher";
import {
  showToast,
  showConfirmModal,
  showAdminBookingModal,
} from "../../lib/alerts";
import {
  SALON_NAME,
  SERVICES,
  todayStr,
  prettyDate,
  formatTime12,
} from "../../lib/config";
import {
  supabase,
  deleteBookingFromDB,
} from "../../lib/supabase";
import { getTelUri } from "../../lib/countries";

export default function AdminPage() {
  // Bookings state (ONLY from Supabase - no hardcoded demo data or localStorage fallback)
  const [bookings, setBookings] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Filters & search
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch bookings ONLY from Supabase
  const loadBookingsFromSupabase = async () => {
    setIsLoadingBookings(true);
    setQueryError(null);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) {
        console.error("Supabase query error:", error);
        setQueryError(error.message || "Failed to load bookings from Supabase.");
        setIsCloudSynced(false);
        setBookings([]);
        return;
      }

      const mapped = (data || []).map((b) => ({
        id: b.id,
        serviceId: b.service_id,
        serviceName: b.service_name,
        price: b.price || "",
        mins: b.mins || 45,
        date: b.date,
        time: b.time,
        name: b.name,
        phone: b.phone,
        notes: b.notes || "",
        status: b.status || "confirmed",
        createdAt: b.created_at,
      }));

      setBookings(mapped);
      setIsCloudSynced(true);
      setQueryError(null);
    } catch (err) {
      console.error("Unexpected error fetching bookings:", err);
      setQueryError(
        err.message || "Network or unexpected error while contacting Supabase."
      );
      setIsCloudSynced(false);
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadBookingsFromSupabase();
  }, []);

  // Cancel booking directly in Supabase
  async function cancelBooking(id) {
    const booking = (bookings || []).find((b) => b.id === id);
    const guest = booking ? booking.name : "Guest";

    const confirmed = await showConfirmModal({
      title: "Cancel Appointment?",
      text: `Are you sure you want to cancel the reservation for ${guest}? This time slot will immediately reopen for other clients in Supabase.`,
      confirmButtonText: "Yes, Cancel Booking",
      cancelButtonText: "Keep Reservation",
      icon: "warning",
      isDanger: true,
    });

    if (!confirmed) return;

    // Delete in Supabase cloud
    const result = await deleteBookingFromDB(id);
    if (!result.success) {
      console.error("Supabase delete failed:", result.error);
      showToast(
        "Cancellation Failed",
        "error",
        result.error || "Could not delete booking from Supabase."
      );
      return;
    }

    // Update state directly from Supabase deletion
    setBookings((prev) => (prev || []).filter((b) => b.id !== id));

    showToast(
      "Appointment Cancelled",
      "success",
      `The booking for ${guest} has been deleted from Supabase.`
    );
  }

  function handleViewDossier(booking) {
    showAdminBookingModal(booking, (cancelId) => {
      cancelBooking(cancelId);
    });
  }

  function copyRlsSql() {
    const sql = "ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;";
    navigator.clipboard?.writeText(sql);
    setCopiedSql(true);
    showToast("SQL Copied!", "success", "Paste in Supabase SQL Editor and click RUN");
    setTimeout(() => setCopiedSql(false), 3000);
  }

  const today = todayStr();

  const sorted = useMemo(() => {
    if (!bookings) return [];
    return [...bookings].sort(
      (a, b) => (a.date + a.time).localeCompare(b.date + b.time)
    );
  }, [bookings]);

  // Filtered by tab and search
  const filteredList = useMemo(() => {
    return sorted.filter((b) => {
      const s = SERVICES.find((x) => x.id === (b.service_id || b.serviceId))?.name || b.service_name || b.serviceName || b.service_id || b.serviceId;
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        (s && s.toLowerCase().includes(q)) ||
        (b.date && b.date.includes(q));

      if (!matchSearch) return false;

      if (activeTab === "upcoming") return b.date > today;
      if (activeTab === "today") return b.date === today;
      if (activeTab === "past") return b.date < today;
      return true;
    });
  }, [sorted, search, activeTab, today]);

  // Statistics
  const upcomingCount = sorted.filter((b) => b.date >= today).length;
  const todayCount = sorted.filter((b) => b.date === today).length;
  const estimatedRevenue = sorted
    .filter((b) => b.date >= today)
    .reduce((sum, b) => {
      const s = SERVICES.find((x) => x.id === (b.service_id || b.serviceId));
      return sum + (s?.priceNum || 0);
    }, 0);

  return (
    <div className="page-wrapper">
      <main className="main-content" style={{ paddingTop: "1.25rem" }}>
        <div className="admin-header-strip">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0 }}>Salon Appointments & Schedule</h2>
              {/* Badge: Shows "Supabase: Connected" (green) ONLY when query succeeds */}
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "999px",
                  background: isCloudSynced
                    ? "rgba(34, 197, 94, 0.15)"
                    : "rgba(239, 68, 68, 0.12)",
                  color: isCloudSynced ? "#15803d" : "#b91c1c",
                  border: `1px solid ${isCloudSynced
                    ? "rgba(34, 197, 94, 0.35)"
                    : "rgba(239, 68, 68, 0.3)"
                    }`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                title={
                  isCloudSynced
                    ? "Live connected with Supabase bookings table"
                    : "Database query disconnected or failed"
                }
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: isCloudSynced ? "#22c55e" : "#ef4444",
                    boxShadow: isCloudSynced
                      ? "0 0 6px #22c55e"
                      : "0 0 6px #ef4444",
                  }}
                />
                {isCloudSynced
                  ? "Supabase: Connected"
                  : isLoadingBookings
                    ? "Supabase: Connecting..."
                    : "Supabase: Disconnected"}
              </span>
            </div>
            <p style={{ marginTop: "0.35rem", color: "var(--text-secondary)" }}>
              Real-time booking schedule loaded directly from Supabase
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn-refresh"
              onClick={loadBookingsFromSupabase}
              disabled={isLoadingBookings}
              title="Refresh appointments from Supabase"
            >
              <RefreshCw
                size={14}
                className={isLoadingBookings ? "spinning-icon" : ""}
              />
              <span>{isLoadingBookings ? "Syncing..." : "Sync Now"}</span>
            </button>
          </div>
        </div>

        {/* Real Supabase Query Error Banner */}
        {queryError && (
          <div
            className="admin-error-box"
            style={{
              marginBottom: "1.75rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <AlertTriangle
              size={22}
              style={{ flexShrink: 0, marginTop: "2px", color: "#dc2626" }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  marginBottom: "0.3rem",
                  color: "#991b1b",
                }}
              >
                Supabase Query Error
              </div>
              <div style={{ fontSize: "0.86rem", color: "#b91c1c" }}>
                {queryError}
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <button
                  type="button"
                  onClick={loadBookingsFromSupabase}
                  style={{
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Retry Query</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Helpful RLS Guide Banner if connected but 0 rows returned */}
        {!queryError && isCloudSynced && sorted.length === 0 && (
          <div
            style={{
              background: "rgba(147, 90, 201, 0.08)",
              border: "1px solid rgba(147, 90, 201, 0.25)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem 1.25rem",
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <Info size={22} color="var(--primary-600)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--primary-900)", marginBottom: "0.25rem" }}>
                Agar Supabase Table Editor me rows hain par yahan 0 show ho rahi hain:
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Supabase me <code>bookings</code> table par <strong>Row Level Security (RLS)</strong> laga hua hai jo reading block kar raha hai.
                Apne Supabase dashboard ke <strong>SQL Editor</strong> me sirf ye 1 line run kar dein:
              </div>
              <div
                style={{
                  marginTop: "0.5rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--surface)",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  fontFamily: "monospace",
                  fontSize: "0.82rem",
                  color: "var(--primary-800)",
                  fontWeight: 600,
                }}
              >
                <span>ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;</span>
                <button
                  type="button"
                  onClick={copyRlsSql}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--primary-600)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Copy SQL query"
                >
                  {copiedSql ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row with Glassmorphism */}
        <div className="admin-stats-row">
          <div className="stat-card glass-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <h4>Today's Appointments</h4>
              <div className="stat-number">{todayCount}</div>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon">
              <CalendarCheck size={24} />
            </div>
            <div className="stat-info">
              <h4>Upcoming Bookings</h4>
              <div className="stat-number">{upcomingCount}</div>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon">
              <Coins size={24} />
            </div>
            <div className="stat-info">
              <h4>Upcoming Est. Value</h4>
              <div className="stat-number">
                Rs {estimatedRevenue.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <h4>Total In Record</h4>
              <div className="stat-number">{sorted.length}</div>
            </div>
          </div>
        </div>

        {/* Bookings Table Container */}
        <div className="admin-table-container glass-morphism">
          <div className="admin-table-toolbar">
            <div className="category-tabs" style={{ margin: 0 }}>
              <button
                type="button"
                className={"category-tab" + (activeTab === "all" ? " active" : "")}
                onClick={() => {
                  setActiveTab("all");
                  showToast("Filter: All Bookings", "info");
                }}
              >
                <Layers size={13} />
                <span>All ({sorted.length})</span>
              </button>
              <button
                type="button"
                className={"category-tab" + (activeTab === "today" ? " active" : "")}
                onClick={() => {
                  setActiveTab("today");
                  showToast("Filter: Today's Bookings", "info");
                }}
              >
                <Clock size={13} />
                <span>Today ({todayCount})</span>
              </button>
              <button
                type="button"
                className={"category-tab" + (activeTab === "upcoming" ? " active" : "")}
                onClick={() => {
                  setActiveTab("upcoming");
                  showToast("Filter: Upcoming Bookings", "info");
                }}
              >
                <CalendarCheck size={13} />
                <span>Upcoming ({sorted.filter((b) => b.date > today).length})</span>
              </button>
              <button
                type="button"
                className={"category-tab" + (activeTab === "past" ? " active" : "")}
                onClick={() => {
                  setActiveTab("past");
                  showToast("Filter: Past Bookings", "info");
                }}
              >
                <History size={13} />
                <span>Past ({sorted.filter((b) => b.date < today).length})</span>
              </button>
            </div>

            <div className="admin-search-box">
              <Search size={14} className="admin-search-icon" />
              <input
                type="text"
                placeholder="Search guest, phone, treatment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-table-wrapper">
            {isLoadingBookings && bookings === null ? (
              <div
                style={{
                  padding: "4rem 1rem",
                  textAlign: "center",
                  color: "var(--primary-700)",
                  fontWeight: 600,
                }}
              >
                <RefreshCw
                  size={24}
                  className="spinning-icon"
                  style={{ margin: "0 auto 0.75rem", display: "block" }}
                />
                <p>Loading appointments directly from Supabase...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div
                style={{
                  padding: "3.5rem 1rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <AlertCircle
                  size={32}
                  style={{
                    margin: "0 auto 0.75rem",
                    display: "block",
                    opacity: 0.6,
                  }}
                />
                <p style={{ fontWeight: 600, fontSize: "1rem" }}>
                  {sorted.length === 0
                    ? "No appointments found in Supabase database."
                    : "No appointments match your filter criteria."}
                </p>
                <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  {sorted.length === 0
                    ? "New reservations made by clients will appear here automatically."
                    : "Try clearing your search term or switching filter tabs."}
                </p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Treatment & Price</th>
                    <th>Guest Details</th>
                    <th>Phone</th>
                    <th>Special Notes</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((b) => {
                    const s = SERVICES.find((x) => x.id === (b.service_id || b.serviceId));
                    const isToday = b.date === today;
                    const isPast = b.date < today;

                    let statusBadge = (
                      <span className="status-badge upcoming">
                        <CheckCircle2 size={12} /> Upcoming
                      </span>
                    );
                    if (isToday) {
                      statusBadge = (
                        <span className="status-badge today">
                          <Clock size={12} /> Today
                        </span>
                      );
                    } else if (isPast) {
                      statusBadge = (
                        <span className="status-badge past">
                          <History size={12} /> Completed
                        </span>
                      );
                    }

                    return (
                      <tr key={b.id}>
                        <td>{statusBadge}</td>
                        <td style={{ fontWeight: 600 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                            }}
                          >
                            <Calendar size={13} color="var(--primary-600)" />
                            <span>{prettyDate(b.date)}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              background: "var(--primary-100)",
                              color: "var(--primary-800)",
                              padding: "0.25rem 0.6rem",
                              borderRadius: "var(--radius-pill)",
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <Clock size={12} />
                            <span>{formatTime12(b.time)}</span>
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--primary-900)",
                            }}
                          >
                            {b.service_name || b.serviceName || s?.name || b.service_id || b.serviceId}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {s?.price || b.price || ""} · {s?.mins || b.mins || 45} mins
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{b.name}</td>
                        <td>
                          <a
                            href={getTelUri(b.phone)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              color: "var(--primary-700)",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                            title={`Call ${b.name} (${b.phone})`}
                          >
                            <Phone size={13} />
                            <span>{b.phone}</span>
                          </a>
                        </td>
                        <td
                          style={{
                            maxWidth: "200px",
                            fontSize: "0.82rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {b.notes ? (
                            <span
                              title={b.notes}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                              }}
                            >
                              <FileText size={12} />
                              <span>
                                {b.notes.length > 25
                                  ? b.notes.slice(0, 25) + "..."
                                  : b.notes}
                              </span>
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            className="btn-detail-link"
                            onClick={() => handleViewDossier(b)}
                            title="View appointment dossier"
                          >
                            <Eye size={13} />
                            <span>Dossier</span>
                          </button>
                          <button
                            type="button"
                            className="btn-cancel-link"
                            onClick={() => cancelBooking(b.id)}
                            title="Cancel this booking in Supabase"
                          >
                            <Trash2 size={13} />
                            <span>Cancel</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">{SALON_NAME}</div>
          <p>Confidential Owner & Stylist Management Console</p>
        </div>
      </footer>
    </div>
  );
}
