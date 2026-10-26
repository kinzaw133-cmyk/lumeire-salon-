"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  ShieldCheck,
  Flower2,
  Scissors,
  Gem,
  Crown,
  Layers,
  Star,
  Award,
  Leaf,
  CalendarCheck,
  Calendar,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MessageSquare,
  Info,
  RotateCcw,
  Receipt,
  MapPin,
  ArrowRight,
  Shield,
} from "lucide-react";
import ThemeSwitcher from "../components/ThemeSwitcher";
import {
  showToast,
  showServiceDetailsModal,
  showBookingSuccessModal,
} from "../lib/alerts";
import {
  SALON_NAME,
  SALON_TAGLINE,
  SALON_PHONE,
  SALON_ADDRESS,
  SALON_HOURS,
  SERVICES,
  SLOTS,
  getBookings,
  saveBookings,
  todayStr,
  prettyDate,
  formatTime12,
} from "../lib/config";
import {
  fetchBookingsFromDB,
  insertBookingIntoDB,
} from "../lib/supabase";
import PhoneInput from "../components/PhoneInput";
import {
  DEFAULT_COUNTRY,
  validatePhoneNumber,
  getTelUri,
} from "../lib/countries";

export default function BookingPage() {
  const [bookings, setBookings] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [phoneError, setPhoneError] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [hideBooked, setHideBooked] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  // Initialize data and default to today's date + sync with Supabase
  useEffect(() => {
    const loaded = getBookings();
    setBookings(loaded);
    setDate(todayStr());

    // Asynchronously sync bookings from Supabase
    async function syncFromCloud() {
      try {
        const res = await fetchBookingsFromDB();
        const cloudBookings = res?.data || (Array.isArray(res) ? res : null);
        if (cloudBookings && Array.isArray(cloudBookings) && cloudBookings.length > 0) {
          setBookings(cloudBookings);
          setSupabaseConnected(true);
        } else if (res && !res.error && cloudBookings !== null) {
          setSupabaseConnected(true);
        }
      } catch (e) {
        console.warn("Supabase background sync:", e);
      }
    }
    syncFromCloud();
  }, []);


  // Filter categories
  const categories = useMemo(() => {
    const list = ["All", ...new Set(SERVICES.map((s) => s.category))];
    return list;
  }, []);

  const filteredServices = useMemo(() => {
    if (activeCategory === "All") return SERVICES;
    return SERVICES.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  const selectedServiceObj = useMemo(() => {
    return SERVICES.find((s) => s.id === service) || null;
  }, [service]);

  // Set of booked slots for the selected date
  const taken = useMemo(() => {
    if (!date) return new Set();
    return new Set(bookings.filter((b) => b.date === date).map((b) => b.time));
  }, [bookings, date]);

  // Check if a time slot on today has already elapsed
  const isPast = (t) => {
    if (date !== todayStr()) return false;
    const now = new Date();
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
  };

  // Ensure booked or past slot is never selected
  useEffect(() => {
    if (time && (taken.has(time) || isPast(time))) {
      setTime("");
    }
  }, [date, bookings, taken]);

  function getCategoryIcon(cat, size = 14) {
    switch (cat) {
      case "Hair":
        return <Scissors size={size} />;
      case "Skin":
        return <Flower2 size={size} />;
      case "Nails":
        return <Gem size={size} />;
      case "Glamour":
        return <Crown size={size} />;
      case "All":
      default:
        return <Layers size={size} />;
    }
  }

  function getServiceIcon(iconName, size = 20) {
    switch (iconName) {
      case "Scissors":
        return <Scissors size={size} />;
      case "Sparkles":
        return <Sparkles size={size} />;
      case "Flower2":
        return <Flower2 size={size} />;
      case "Gem":
        return <Gem size={size} />;
      case "Crown":
        return <Crown size={size} />;
      default:
        return <Sparkles size={size} />;
    }
  }

  function handleSelectService(s) {
    setService(s.id);
    setError("");
    showToast(`Treatment Selected: ${s.name}`, "success", `${s.price} · ${s.mins} mins`);
  }

  function handleSelectSlot(slotTime) {
    if (taken.has(slotTime) || isPast(slotTime)) {
      showToast("Time Slot Unavailable", "warning", "This slot is booked or past.");
      return;
    }
    setTime(slotTime);
    setError("");
    showToast(`Time Slot Reserved: ${formatTime12(slotTime)}`, "info", prettyDate(date));
  }

  function handleDateChange(newDate, label) {
    setDate(newDate);
    setTime("");
    setError("");
    if (label) {
      showToast(`Date Changed: ${label}`, "info", prettyDate(newDate));
    }
  }

  function handleToggleHideBooked() {
    const nextState = !hideBooked;
    setHideBooked(nextState);
    showToast(
      nextState ? "Hiding Booked Slots" : "Showing All Slots",
      "info",
      nextState ? "Only open slots are shown" : "Booked & past slots visible"
    );
  }

  function openServiceModal(e, s) {
    e.stopPropagation();
    showServiceDetailsModal(s, (id) => {
      setService(id);
      setError("");
      showToast(`Selected: ${s.name}`, "success");
    });
  }

  function submit(e) {
    e.preventDefault();
    setError("");

    if (!service) {
      const msg = "Please select a salon treatment to continue.";
      setError(msg);
      showToast("Treatment Required", "warning", msg);
      return;
    }
    if (!date) {
      const msg = "Please choose a date for your appointment.";
      setError(msg);
      showToast("Date Required", "warning", msg);
      return;
    }
    if (!time) {
      const msg = "Please select an available time slot.";
      setError(msg);
      showToast("Time Slot Required", "warning", msg);
      return;
    }
    if (name.trim().length < 2) {
      const msg = "Please enter your full name.";
      setError(msg);
      showToast("Name Required", "warning", msg);
      return;
    }
    const phoneVal = validatePhoneNumber(phone, selectedCountry);
    if (!phoneVal.isValid) {
      setError(phoneVal.message);
      setPhoneError(phoneVal.message);
      showToast("Phone Number Invalid", "warning", phoneVal.message);
      return;
    }
    setPhoneError("");
    const validatedPhone = phoneVal.fullInternational;

    // Double check fresh storage to prevent collision
    const latest = getBookings();
    if (latest.some((b) => b.date === date && b.time === time)) {
      setBookings(latest);
      setTime("");
      const msg = "Apologies, that time slot was just booked. Please pick another.";
      setError(msg);
      showToast("Slot Just Booked", "error", msg);
      return;
    }

    const booking = {
      id: "lum-" + Date.now().toString(36),
      serviceId: service,
      service_id: service,
      serviceName: selectedServiceObj?.name || service,
      service_name: selectedServiceObj?.name || service,
      price: selectedServiceObj?.price || "",
      mins: selectedServiceObj?.mins || 45,
      date,
      time,
      name: name.trim(),
      phone: validatedPhone,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const next = [...latest, booking];
    saveBookings(next);
    setBookings(next);
    setDone(booking);

    // Save to Supabase Cloud in background
    insertBookingIntoDB(booking).then((res) => {
      if (res && res.success) {
        setSupabaseConnected(true);
      }
    }).catch((err) => {
      console.warn("Supabase booking insert sync note:", err);
    });

    // Trigger celebratory SweetAlert2 modal with direct Calendar download
    showBookingSuccessModal(booking, {
      onDownloadIcs: () => downloadCalendarEvent(booking),
      onBookAnother: reset,
    });
  }

  function reset() {
    setDone(null);
    setService("");
    setDate(todayStr());
    setTime("");
    setName("");
    setPhone("");
    setPhoneError("");
    setSelectedCountry(DEFAULT_COUNTRY);
    setNotes("");
    setError("");
    showToast("Ready for New Booking", "info");
  }

  function downloadCalendarEvent(booking) {
    const s = SERVICES.find((x) => x.id === booking.serviceId) || {};
    const [h, m] = booking.time.split(":").map(Number);
    const start = new Date(booking.date + "T" + booking.time + ":00");
    const end = new Date(start.getTime() + (s.mins || 60) * 60000);

    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Lumiere Salon//Booking//EN",
      "BEGIN:VEVENT",
      `UID:${booking.id}@lumieresalon.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${SALON_NAME}: ${s.name || "Appointment"}`,
      `DESCRIPTION:Appointment for ${booking.name} (${s.name || ""}). Contact: ${SALON_PHONE}`,
      `LOCATION:${SALON_ADDRESS}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Lumiere-Salon-${booking.date}-${booking.time}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Calendar Event Downloaded", "success", "Saved .ics appointment file");
  }

  // Confirmation screen
  if (done) {
    const s = SERVICES.find((x) => x.id === done.serviceId) || {};
    return (
      <div className="page-wrapper">
        <header className="site-header">
          <div className="header-container">
            <Link href="/" className="brand-wrapper" onClick={reset}>
              <div className="brand-emblem">
                <Sparkles size={20} />
              </div>
              <div className="brand-text">
                <h1>{SALON_NAME}</h1>
                <span>{SALON_TAGLINE}</span>
              </div>
            </Link>

            <div className="header-meta">
              <ThemeSwitcher />
              <Link href="/admin" className="nav-admin-link">
                <Shield size={14} />
                <span>Owner Portal</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="confirmation-card glass-morphism">
            <div className="confirmation-header">
              <div className="check-ring-icon">
                <CheckCircle2 size={38} />
              </div>
              <h2>You’re Confirmed, {done.name.split(" ")[0]}!</h2>
              <p>Your appointment has been reserved in our salon calendar.</p>
            </div>

            <div className="confirmation-ticket">
              <div className="ticket-row-grid">
                <div className="ticket-cell">
                  <label>
                    <Sparkles size={13} /> Treatment
                  </label>
                  <span>{s.name || done.serviceId}</span>
                </div>
                <div className="ticket-cell">
                  <label>
                    <Clock size={13} /> Price & Duration
                  </label>
                  <span>{s.price} · {s.mins} mins</span>
                </div>
                <div className="ticket-cell">
                  <label>
                    <Calendar size={13} /> Date
                  </label>
                  <span>{prettyDate(done.date)}</span>
                </div>
                <div className="ticket-cell">
                  <label>
                    <Clock size={13} /> Appointment Time
                  </label>
                  <span>{formatTime12(done.time)}</span>
                </div>
                <div className="ticket-cell">
                  <label>
                    <User size={13} /> Guest Name
                  </label>
                  <span>{done.name}</span>
                </div>
                <div className="ticket-cell">
                  <label>
                    <Phone size={13} /> Contact Phone
                  </label>
                  <span>
                    <a
                      href={getTelUri(done.phone)}
                      style={{ color: "var(--primary-700)", textDecoration: "none", fontWeight: 600 }}
                      title={`Call ${done.phone}`}
                    >
                      {done.phone}
                    </a>
                  </span>
                </div>
                <div className="ticket-cell" style={{ gridColumn: "1 / -1" }}>
                  <label>
                    <MapPin size={13} /> Salon Location
                  </label>
                  <span>{SALON_ADDRESS} ({SALON_HOURS})</span>
                </div>
              </div>

              <div className="confirmation-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => downloadCalendarEvent(done)}
                >
                  <CalendarPlus size={18} />
                  <span>Add to My Calendar (.ics)</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={reset}
                >
                  <RotateCcw size={16} />
                  <span>Book Another Appointment</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-brand">{SALON_NAME}</div>
            <p>{SALON_ADDRESS} · {SALON_PHONE}</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <main className="main-content" style={{ paddingTop: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.85rem" }}>
          <div className="hours-badge">
            <Clock size={13} />
            <span>{SALON_HOURS}</span>
          </div>
        </div>
        {/* Hero Visual Card */}
        <section className="salon-hero-card">
          <img
            src="/images/salon-hero.jpg"
            alt="Lumière Luxury Salon Interior"
            className="hero-image"
          />
          <div className="hero-scrim" />
          <div className="hero-content">
            <div className="hero-badge">
              <Star size={13} className="star" />
              <span>4.9 · 420+ Luxury Guest Reviews</span>
            </div>
            <h2>Elevate Your Signature Style</h2>
            <p>
              Experience bespoke hair artistry, rejuvenating skincare, and bridal excellence in our serene luxury atelier.
            </p>
            <div className="hero-perks">
              <span className="hero-perk-item">
                <Award size={14} />
                <span>Master Certified Stylists</span>
              </span>
              <span className="hero-perk-item">
                <Leaf size={14} />
                <span>Organic Botanical Care</span>
              </span>
              <span className="hero-perk-item">
                <CalendarCheck size={14} />
                <span>Instant Reserved Booking</span>
              </span>
            </div>
          </div>
        </section>

        <form onSubmit={submit} noValidate>
          <div className="booking-layout">
            {/* Left Main Steps Panel */}
            <div className="booking-main-panel">
              {/* Step 1: Select Service */}
              <section className={"step-section" + (service ? " is-active" : "")}>
                <div className="step-header">
                  <div className="step-title-group">
                    <div className="step-number">
                      <Sparkles size={16} />
                    </div>
                    <div className="step-title-text">
                      <h3>Choose Treatment</h3>
                      <p>Select your desired hair, skin, or beauty service</p>
                    </div>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="category-tabs" role="tablist">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={activeCategory === cat}
                      className={"category-tab" + (activeCategory === cat ? " active" : "")}
                      onClick={() => {
                        setActiveCategory(cat);
                        showToast(`Filtered: ${cat}`, "info");
                      }}
                    >
                      {getCategoryIcon(cat, 14)}
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>

                {/* Services Grid */}
                <div className="services-grid">
                  {filteredServices.map((s) => {
                    const isSelected = service === s.id;
                    return (
                      <div
                        key={s.id}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        className={"service-card" + (isSelected ? " selected" : "")}
                        onClick={() => handleSelectService(s)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelectService(s);
                          }
                        }}
                      >
                        <div className="service-card-top">
                          <div className="service-icon-box">
                            {getServiceIcon(s.iconName || "Sparkles", 20)}
                          </div>
                          <div className="service-card-badges">
                            <button
                              type="button"
                              className="service-info-btn"
                              title="View Treatment Perks & Details"
                              onClick={(e) => openServiceModal(e, s)}
                            >
                              <Info size={14} />
                            </button>
                            <div className="service-check">
                              {isSelected && <Check size={14} />}
                            </div>
                          </div>
                        </div>
                        <div className="service-title">{s.name}</div>
                        <div className="service-desc">{s.description}</div>
                        <div className="service-footer">
                          <span className="service-duration">
                            <Clock size={13} /> {s.mins} min
                          </span>
                          <span className="service-price">{s.price}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Step 2: Date & Time Slots */}
              <section className={"step-section" + (date && time ? " is-active" : "")}>
                <div className="step-header">
                  <div className="step-title-group">
                    <div className="step-number">
                      <Calendar size={16} />
                    </div>
                    <div className="step-title-text">
                      <h3>Select Date & Time</h3>
                      <p>Booked and past time slots are greyed out and cannot be selected</p>
                    </div>
                  </div>
                </div>

                {/* Date Controls */}
                <div className="date-controls">
                  <div className="date-input-group">
                    <div className="custom-date-picker">
                      <input
                        type="date"
                        value={date}
                        min={todayStr()}
                        onChange={(e) => handleDateChange(e.target.value)}
                        aria-label="Appointment date"
                      />
                    </div>
                    <div className="quick-date-buttons">
                      <button
                        type="button"
                        className={"quick-date-btn" + (date === todayStr() ? " active" : "")}
                        onClick={() => handleDateChange(todayStr(), "Today")}
                      >
                        <CalendarDays size={14} />
                        <span>Today</span>
                      </button>
                      <button
                        type="button"
                        className={"quick-date-btn" + (date === todayStr(1) ? " active" : "")}
                        onClick={() => handleDateChange(todayStr(1), "Tomorrow")}
                      >
                        <CalendarDays size={14} />
                        <span>Tomorrow</span>
                      </button>
                      <button
                        type="button"
                        className={"quick-date-btn" + (date === todayStr(2) ? " active" : "")}
                        onClick={() => handleDateChange(todayStr(2), "In 2 Days")}
                      >
                        <CalendarDays size={14} />
                        <span>In 2 Days</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Slot Legend & Display Toggle */}
                <div className="slots-header-bar">
                  <div className="slots-legend">
                    <div className="legend-item">
                      <span className="legend-dot available" />
                      <span>Available</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot booked" />
                      <span>Booked</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot selected" />
                      <span>Selected</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="filter-toggle-btn"
                    onClick={handleToggleHideBooked}
                  >
                    {hideBooked ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{hideBooked ? "Show All Slots" : "Hide Booked Slots"}</span>
                  </button>
                </div>

                {/* Time Slot Buttons Grid */}
                <div className="slots-grid">
                  {SLOTS.map((t) => {
                    const isBooked = taken.has(t);
                    const isPastSlot = isPast(t);
                    const isDisabled = isBooked || isPastSlot;
                    const isSelected = time === t;

                    // If user toggles to hide booked/past slots completely
                    if (hideBooked && isDisabled) {
                      return null;
                    }

                    let statusLabel = "Open";
                    let stateClass = "is-available";

                    if (isBooked) {
                      statusLabel = "Booked";
                      stateClass = "is-booked";
                    } else if (isPastSlot) {
                      statusLabel = "Past";
                      stateClass = "is-past";
                    } else if (isSelected) {
                      statusLabel = "Selected";
                      stateClass = "is-selected";
                    }

                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={isDisabled}
                        aria-disabled={isDisabled}
                        tabIndex={isDisabled ? -1 : 0}
                        className={`slot-button ${stateClass}`}
                        onClick={() => handleSelectSlot(t)}
                        title={
                          isBooked
                            ? `${formatTime12(t)} is already booked and unavailable`
                            : isPastSlot
                            ? `${formatTime12(t)} is in the past`
                            : `Select ${formatTime12(t)}`
                        }
                      >
                        <span className="slot-time-text">{formatTime12(t)}</span>
                        <span className="slot-badge-text">
                          {isBooked ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                              <Lock size={10} /> Booked
                            </span>
                          ) : (
                            statusLabel
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Step 3: Guest Contact Details */}
              <section className={"step-section" + (name && phone ? " is-active" : "")}>
                <div className="step-header">
                  <div className="step-title-group">
                    <div className="step-number">
                      <User size={16} />
                    </div>
                    <div className="step-title-text">
                      <h3>Guest Details</h3>
                      <p>Where we will send your appointment confirmation & reminder</p>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="input-field-group">
                    <label className="input-label" htmlFor="client-name">
                      <User size={14} /> Full Name *
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <User size={16} />
                      </span>
                      <input
                        id="client-name"
                        className="text-input"
                        placeholder="e.g. Katherine Pierce"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="input-field-group">
                    <label className="input-label" htmlFor="client-phone">
                      <Phone size={14} /> Phone Number *
                    </label>
                    <PhoneInput
                      id="client-phone"
                      value={phone}
                      onChange={(newVal) => {
                        setPhone(newVal);
                        if (phoneError) setPhoneError("");
                      }}
                      selectedCountry={selectedCountry}
                      onCountryChange={(newCountry) => {
                        setSelectedCountry(newCountry);
                        if (phoneError) setPhoneError("");
                      }}
                      error={phoneError}
                    />
                    {phoneError && (
                      <span className="field-error-text" role="alert">
                        {phoneError}
                      </span>
                    )}
                  </div>

                  <div className="input-field-group form-grid-full">
                    <label className="input-label" htmlFor="client-notes">
                      <MessageSquare size={14} /> Special Requests / Stylist Notes (Optional)
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <MessageSquare size={16} />
                      </span>
                      <input
                        id="client-notes"
                        className="text-input"
                        placeholder="e.g. Sensitive scalp, quiet appointment, bridal trial preferences..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {error && (
                <div className="error-banner" role="alert">
                  <Info size={18} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Right Sticky Summary Sidebar */}
            <aside className="summary-sidebar">
              <div className="summary-title">
                <h3>
                  <Receipt size={20} />
                  <span>Booking Summary</span>
                </h3>
                <p>Live overview of your appointment</p>
              </div>

              <div className="summary-details-list">
                <div className="summary-row">
                  <span className="summary-label">
                    <Sparkles size={14} /> Treatment
                  </span>
                  <span className="summary-value">
                    {selectedServiceObj ? selectedServiceObj.name : "Not selected"}
                  </span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">
                    <Calendar size={14} /> Date
                  </span>
                  <span className="summary-value">
                    {date ? prettyDate(date) : "Pick date"}
                  </span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">
                    <Clock size={14} /> Time Slot
                  </span>
                  <span className="summary-value">
                    {time ? formatTime12(time) : "Select time"}
                  </span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">
                    <Clock size={14} /> Duration
                  </span>
                  <span className="summary-value">
                    {selectedServiceObj ? `${selectedServiceObj.mins} mins` : "—"}
                  </span>
                </div>

                <div className="summary-divider" />

                <div className="summary-total-row">
                  <span className="summary-label" style={{ fontWeight: 600 }}>Total</span>
                  <span className="summary-total-price">
                    {selectedServiceObj ? selectedServiceObj.price : "—"}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={!service || !date || !time}
              >
                <Sparkles size={18} />
                <span>Confirm Appointment</span>
              </button>

              <div className="summary-guarantee">
                <ShieldCheck size={14} />
                <span>Instant Confirmation · No Prepayment Required</span>
              </div>
            </aside>
          </div>
        </form>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">{SALON_NAME}</div>
          <p>{SALON_ADDRESS} · {SALON_PHONE}</p>
          <p style={{ fontSize: "0.78rem" }}>
            Luxury Atelier Appointments · Powered by Lumière Boutique Booking System
          </p>
        </div>
      </footer>
    </div>
  );
}
