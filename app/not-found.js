"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "5rem 1.5rem" }}>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--primary-900)" }}>
        Page Not Found
      </h2>
      <p style={{ color: "var(--text-secondary)", margin: "1rem 0 2rem" }}>
        The appointment page or resource you are looking for does not exist.
      </p>
      <Link href="/" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
        <ArrowLeft size={16} />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
