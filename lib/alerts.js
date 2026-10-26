"use client";

import Swal from "sweetalert2";
import { getTelUri } from "./countries";

/**
 * Glassmorphic Toast Mixin
 */
export const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
  background: "rgba(255, 255, 255, 0.88)",
  color: "var(--text-main)",
  customClass: {
    popup: "salon-swal-toast glass-morphism",
    timerProgressBar: "salon-swal-toast-progress",
  },
  didOpen: (toastEl) => {
    toastEl.addEventListener("mouseenter", Swal.stopTimer);
    toastEl.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

/**
 * Show a quick toast notification
 * @param {string} title 
 * @param {'success' | 'info' | 'warning' | 'error'} icon 
 * @param {string} [text] 
 */
export function showToast(title, icon = "success", text = "") {
  return toast.fire({
    icon,
    title,
    text,
  });
}

/**
 * Show a glassmorphic Confirmation modal (e.g. for cancelling or resetting)
 */
export async function showConfirmModal({
  title = "Are you sure?",
  text = "This action cannot be undone.",
  confirmButtonText = "Yes, proceed",
  cancelButtonText = "Nevermind",
  icon = "warning",
  isDanger = false,
} = {}) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    background: "rgba(255, 255, 255, 0.92)",
    color: "var(--text-main)",
    customClass: {
      popup: "salon-swal-popup glass-morphism",
      title: "salon-swal-title",
      htmlContainer: "salon-swal-html",
      confirmButton: isDanger ? "salon-swal-btn-danger" : "salon-swal-btn-primary",
      cancelButton: "salon-swal-btn-secondary",
      actions: "salon-swal-actions",
    },
    buttonsStyling: false,
    backdrop: "rgba(35, 15, 55, 0.45)",
  });

  return result.isConfirmed;
}

/**
 * Show Service Details in an elegant SweetAlert2 modal
 */
export async function showServiceDetailsModal(service, onSelect) {
  if (!service) return;

  const perksList = (service.perks || [
    "Personalized consultation with a Master Stylist",
    "Organic botanical hair/skin treatment care",
    "Complimentary artisanal tea or sparkling water",
    "Tailored aftercare recommendations",
  ])
    .map(
      (p) =>
        `<li style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.45rem;color:var(--text-secondary);font-size:0.88rem;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:var(--primary-100);color:var(--primary-700);font-size:0.75rem;font-weight:700;">✓</span>
          <span>${p}</span>
        </li>`
    )
    .join("");

  const html = `
    <div style="text-align:left;padding:0.25rem 0.25rem 0.5rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
        <span style="background:var(--primary-100);color:var(--primary-700);padding:0.35rem 0.85rem;border-radius:9999px;font-size:0.8rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
          ${service.category || "Treatment"}
        </span>
        <span style="font-size:1.15rem;font-weight:700;color:var(--primary-800);font-family:var(--font-serif);">
          ${service.price} <span style="font-size:0.82rem;font-weight:500;color:var(--text-muted);font-family:var(--font-sans);">· ${service.mins} mins</span>
        </span>
      </div>

      <p style="color:var(--text-main);font-size:0.95rem;line-height:1.55;margin-bottom:1.25rem;">
        ${service.description}
      </p>

      <div style="background:var(--primary-50);border:1px solid var(--border);border-radius:14px;padding:0.9rem 1rem;margin-bottom:0.75rem;">
        <div style="font-size:0.82rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--primary-700);margin-bottom:0.6rem;">
          ✦ What's Included in this Treatment
        </div>
        <ul style="list-style:none;padding:0;margin:0;">
          ${perksList}
        </ul>
      </div>
    </div>
  `;

  const result = await Swal.fire({
    title: service.name,
    html,
    iconHtml: `<span style="font-size:1.6rem;">${service.icon || "✨"}</span>`,
    showCancelButton: true,
    confirmButtonText: "Select This Treatment",
    cancelButtonText: "Close Details",
    background: "rgba(255, 255, 255, 0.94)",
    color: "var(--text-main)",
    customClass: {
      popup: "salon-swal-popup glass-morphism",
      title: "salon-swal-title",
      confirmButton: "salon-swal-btn-primary",
      cancelButton: "salon-swal-btn-secondary",
      actions: "salon-swal-actions",
      icon: "salon-swal-custom-icon",
    },
    buttonsStyling: false,
    backdrop: "rgba(35, 15, 55, 0.45)",
  });

  if (result.isConfirmed && typeof onSelect === "function") {
    onSelect(service.id);
  }
}

/**
 * Show booking confirmed celebratory modal
 */
export async function showBookingSuccessModal(booking, { onDownloadIcs, onBookAnother }) {
  const html = `
    <div style="text-align:center;padding:0.25rem 0;">
      <p style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:1.25rem;">
        We have reserved your slot for <strong>${booking.serviceName || "Treatment"}</strong>.
      </p>

      <div style="background:var(--primary-50);border:1px solid var(--border);border-radius:16px;padding:1.1rem 1.25rem;text-align:left;display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
        <div>
          <span style="font-size:0.75rem;text-transform:uppercase;color:var(--text-muted);font-weight:600;display:block;">Date</span>
          <span style="font-weight:600;color:var(--text-main);font-size:0.9rem;">${booking.date}</span>
        </div>
        <div>
          <span style="font-size:0.75rem;text-transform:uppercase;color:var(--text-muted);font-weight:600;display:block;">Time</span>
          <span style="font-weight:600;color:var(--primary-700);font-size:0.9rem;">${booking.time}</span>
        </div>
        <div>
          <span style="font-size:0.75rem;text-transform:uppercase;color:var(--text-muted);font-weight:600;display:block;">Guest Name</span>
          <span style="font-weight:600;color:var(--text-main);font-size:0.9rem;">${booking.name}</span>
        </div>
        <div>
          <span style="font-size:0.75rem;text-transform:uppercase;color:var(--text-muted);font-weight:600;display:block;">Total Fee</span>
          <span style="font-weight:700;color:var(--primary-800);font-size:0.9rem;">${booking.price || "Complimentary"}</span>
        </div>
      </div>
      <p style="font-size:0.8rem;color:var(--text-muted);margin:0;">
        📍 182 Lavender Boulevard, Suite 4B · Instant reservation confirmed
      </p>
    </div>
  `;

  return Swal.fire({
    title: `You're Confirmed, ${booking.name.split(" ")[0]}!`,
    html,
    icon: "success",
    showCancelButton: true,
    confirmButtonText: "📅 Add to Calendar (.ics)",
    cancelButtonText: "Done",
    background: "rgba(255, 255, 255, 0.95)",
    color: "var(--text-main)",
    customClass: {
      popup: "salon-swal-popup glass-morphism",
      title: "salon-swal-title",
      confirmButton: "salon-swal-btn-primary",
      cancelButton: "salon-swal-btn-secondary",
      actions: "salon-swal-actions",
    },
    buttonsStyling: false,
    backdrop: "rgba(35, 15, 55, 0.45)",
  }).then((result) => {
    if (result.isConfirmed && typeof onDownloadIcs === "function") {
      onDownloadIcs();
    }
  });
}

/**
 * Show Admin booking details modal
 */
export async function showAdminBookingModal(booking, onCancel) {
  if (!booking) return;

  const html = `
    <div style="text-align:left;padding:0.25rem;">
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
        <div style="width:44px;height:44px;border-radius:12px;background:var(--primary-100);display:flex;align-items:center;justify-content:center;color:var(--primary-700);font-size:1.25rem;">
          👤
        </div>
        <div>
          <div style="font-weight:700;font-size:1.1rem;color:var(--text-main);">${booking.name}</div>
          <a href="${getTelUri(booking.phone)}" style="font-size:0.85rem;color:var(--primary-700);font-weight:600;text-decoration:none;">
            📞 ${booking.phone}
          </a>
        </div>
      </div>

      <div style="background:var(--primary-50);border:1px solid var(--border);border-radius:14px;padding:0.9rem;margin-bottom:1rem;display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
        <div>
          <span style="font-size:0.72rem;text-transform:uppercase;color:var(--text-muted);font-weight:700;display:block;">Treatment</span>
          <span style="font-weight:600;color:var(--text-main);font-size:0.92rem;">${booking.service_name || booking.serviceName || booking.service_id || booking.serviceId}</span>
        </div>
        <div>
          <span style="font-size:0.72rem;text-transform:uppercase;color:var(--text-muted);font-weight:700;display:block;">Appointment</span>
          <span style="font-weight:600;color:var(--primary-700);font-size:0.92rem;">${booking.date} at ${booking.time}</span>
        </div>
        <div>
          <span style="font-size:0.72rem;text-transform:uppercase;color:var(--text-muted);font-weight:700;display:block;">Price & Time</span>
          <span style="font-weight:600;color:var(--text-main);font-size:0.92rem;">${booking.price || "—"} (${booking.mins || 45} mins)</span>
        </div>
        <div>
          <span style="font-size:0.72rem;text-transform:uppercase;color:var(--text-muted);font-weight:700;display:block;">Booking Reference</span>
          <span style="font-family:monospace;font-size:0.85rem;color:var(--text-secondary);">${booking.id}</span>
        </div>
      </div>

      ${
        booking.notes
          ? `<div style="background:rgba(255,255,255,0.7);border:1px solid var(--border);border-radius:12px;padding:0.75rem 0.9rem;margin-bottom:0.5rem;">
              <span style="font-size:0.75rem;text-transform:uppercase;color:var(--text-muted);font-weight:700;display:block;margin-bottom:0.25rem;">Stylist / Guest Notes</span>
              <p style="margin:0;font-size:0.88rem;color:var(--text-secondary);font-style:italic;">"${booking.notes}"</p>
            </div>`
          : ""
      }
    </div>
  `;

  const result = await Swal.fire({
    title: "Appointment Dossier",
    html,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Close Dossier",
    denyButtonText: "Cancel Appointment",
    cancelButtonText: "Call Guest",
    background: "rgba(255, 255, 255, 0.95)",
    color: "var(--text-main)",
    customClass: {
      popup: "salon-swal-popup glass-morphism",
      title: "salon-swal-title",
      confirmButton: "salon-swal-btn-secondary",
      denyButton: "salon-swal-btn-danger",
      cancelButton: "salon-swal-btn-primary",
      actions: "salon-swal-actions",
    },
    buttonsStyling: false,
    backdrop: "rgba(35, 15, 55, 0.45)",
  });

  if (result.isDenied && typeof onCancel === "function") {
    onCancel(booking.id);
  } else if (result.dismiss === Swal.DismissReason.cancel && booking.phone) {
    window.location.href = getTelUri(booking.phone);
  }
}
