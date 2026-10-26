"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Clock,
  Sparkles,
  Phone,
  ArrowRight,
  TrendingUp,
  Users,
  Award,
  ChevronRight,
  RefreshCw,
  CalendarPlus,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  SALON_NAME,
  SALON_TAGLINE,
  SERVICES,
  getBookings,
  todayStr,
  prettyDate,
  formatTime12,
} from "../../lib/config";
import { fetchBookingsFromDB } from "../../lib/supabase";
import { getTelUri } from "../../lib/countries";

export default function DashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Load from localStorage first, then sync with Supabase
  useEffect(() => {
    const local = getBookings();
    setBookings(local);
    setIsLoading(false);

    async function loadCloud() {
      try {
        const res = await fetchBookingsFromDB();
        const cloudData = res?.data || (Array.isArray(res) ? res : null);
        if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
          setBookings(cloudData);
          setIsCloudSynced(true);
        } else if (res && !res.error && cloudData !== null) {
          setIsCloudSynced(true);
        }
      } catch (err) {
        console.warn("Dashboard cloud sync:", err);
      }
    }
    loadCloud();
  }, []);

  const today = todayStr();

  // Summary statistics
  const totalBookings = bookings.length;

  const todayBookings = useMemo(() => {
    return bookings.filter((b) => b.date === today).length;
  }, [bookings, today]);

  const upcomingBookings = useMemo(() => {
    return bookings.filter((b) => b.date >= today).length;
  }, [bookings, today]);

  // Find the most booked service
  const mostBookedService = useMemo(() => {
    if (bookings.length === 0) return { name: "No bookings yet", count: 0, category: "Hair" };

    const counts = {};
    bookings.forEach((b) => {
      // Support both camelCase and snake_case properties
      const sId = b.serviceId || b.service_id;
      const sName = b.serviceName || b.service_name || SERVICES.find((x) => x.id === sId)?.name || sId || "Custom Service";
      counts[sName] = (counts[sName] || 0) + 1;
    });

    let topName = "";
    let topCount = 0;
    Object.entries(counts).forEach(([name, count]) => {
      if (count > topCount) {
        topCount = count;
        topName = name;
      }
    });

    const matchedService = SERVICES.find((s) => s.name === topName || s.id === topName);
    return {
      name: topName,
      count: topCount,
      category: matchedService?.category || "Popular",
    };
  }, [bookings]);

  // Next 5 upcoming appointments sorted chronologically
  const nextAppointments = useMemo(() => {
    return bookings
      .filter((b) => b.date >= today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 5);
  }, [bookings, today]);

  return (
    <div className="page-wrapper">
      <main className="main-content" style={{ paddingTop: "1.5rem" }}>
        {/* Dashboard Title Banner */}
        <div className="dashboard-hero-strip glass-card">
          <div className="dashboard-hero-left">
            <div className="dashboard-pill-badge">
              <LayoutDashboard size={14} />
              <span>Salon Overview & Analytics</span>
            </div>
            <h1 className="dashboard-title">Atelier Operations Dashboard</h1>
            <p className="dashboard-subtitle">
              Live reservations metrics, appointment pipeline, and guest schedule at a glance.
            </p>
          </div>

          <div className="dashboard-hero-actions">
            <Link href="/" className="btn-primary" style={{ textDecoration: "none" }}>
              <CalendarPlus size={16} />
              <span>Book Appointment</span>
            </Link>
            <Link href="/admin" className="btn-secondary" style={{ textDecoration: "none" }}>
              <ShieldCheck size={16} />
              <span>Owner Portal</span>
            </Link>
          </div>
        </div>

        {/* 4 Summary Cards Grid */}
        <div className="dashboard-stats-grid">
          {/* Card 1: Total Bookings */}
          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: "rgba(147, 90, 201, 0.15)", color: "var(--primary-700)" }}>
              <Calendar size={24} />
            </div>
            <div className="stat-info">
              <h4>Total Bookings</h4>
              <div className="stat-number">{totalBookings}</div>
              <span className="stat-foot-note">Lifetime reservations recorded</span>
            </div>
          </div>

          {/* Card 2: Today's Bookings */}
          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: "rgba(234, 179, 8, 0.15)", color: "#b45309" }}>
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <h4>Today's Appointments</h4>
              <div className="stat-number">{todayBookings}</div>
              <span className="stat-foot-note">Scheduled for {prettyDate(today).split(",")[0] || "Today"}</span>
            </div>
          </div>

          {/* Card 3: Upcoming Bookings */}
          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#15803d" }}>
              <CalendarCheck size={24} />
            </div>
            <div className="stat-info">
              <h4>Upcoming Bookings</h4>
              <div className="stat-number">{upcomingBookings}</div>
              <span className="stat-foot-note">Future client reservations</span>
            </div>
          </div>

          {/* Card 4: Most Booked Service */}
          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: "rgba(236, 72, 153, 0.15)", color: "#be185d" }}>
              <Award size={24} />
            </div>
            <div className="stat-info">
              <h4>Most Booked Service</h4>
              <div className="stat-number-text" title={mostBookedService.name}>
                {mostBookedService.name}
              </div>
              <span className="stat-foot-note">
                {mostBookedService.count > 0
                  ? `${mostBookedService.count} appointment${mostBookedService.count > 1 ? "s" : ""} booked`
                  : "Awaiting first client"}
              </span>
            </div>
          </div>
        </div>

        {/* Next 5 Appointments Section */}
        <div className="dashboard-section-box glass-card">
          <div className="dashboard-section-header">
            <div>
              <h2 className="dashboard-section-title">
                <Clock size={20} className="header-icon" />
                <span>Next 5 Upcoming Appointments</span>
              </h2>
              <p className="dashboard-section-desc">
                Upcoming guests scheduled in chronological order with instant tap-to-call.
              </p>
            </div>
            <Link href="/admin" className="dashboard-view-all-link">
              <span>View Full Schedule</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {nextAppointments.length === 0 ? (
            <div className="dashboard-empty-state">
              <Sparkles size={36} className="empty-icon" />
              <h3>No Upcoming Appointments</h3>
              <p>There are no appointments scheduled for today or upcoming dates.</p>
              <Link href="/" className="btn-primary" style={{ marginTop: "1rem", textDecoration: "none" }}>
                <CalendarPlus size={16} />
                <span>Reserve a Client Slot</span>
              </Link>
            </div>
          ) : (
            <div className="dashboard-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Client Name</th>
                    <th>Treatment</th>
                    <th>Price & Duration</th>
                    <th>Contact Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {nextAppointments.map((b) => {
                    const sId = b.serviceId || b.service_id;
                    const serviceObj = SERVICES.find((x) => x.id === sId);
                    const treatmentName =
                      b.serviceName ||
                      b.service_name ||
                      serviceObj?.name ||
                      sId ||
                      "Salon Treatment";
                    const price = b.price || serviceObj?.price || "—";
                    const duration = b.mins || serviceObj?.mins || 45;
                    const isToday = b.date === today;

                    return (
                      <tr key={b.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
                            <Calendar size={14} color="var(--primary-600)" />
                            <span>{prettyDate(b.date)}</span>
                            {isToday && (
                              <span className="badge-today-pill">Today</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="time-badge-pill">
                            <Clock size={12} />
                            <span>{formatTime12(b.time)}</span>
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {b.name}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--primary-900)" }}>
                            {treatmentName}
                          </div>
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          <span style={{ fontWeight: 600, color: "var(--primary-800)" }}>{price}</span> · {duration} mins
                        </td>
                        <td>
                          {/* Tap-to-call link compatible with international (+92) and legacy numbers */}
                          <a
                            href={getTelUri(b.phone)}
                            className="dashboard-phone-link"
                            title={`Call ${b.name} at ${b.phone}`}
                          >
                            <Phone size={13} />
                            <span>{b.phone}</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">{SALON_NAME}</div>
          <p>{SALON_TAGLINE} · Real-time Operational Insights</p>
        </div>
      </footer>
    </div>
  );
}
