"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div style={{ textAlign: "center", padding: "5rem 1.5rem", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "inline-flex", padding: "1rem", borderRadius: "50%", background: "rgba(220, 38, 38, 0.1)", color: "#dc2626", marginBottom: "1rem" }}>
        <AlertTriangle size={36} />
      </div>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.85rem", color: "var(--primary-900)", marginBottom: "0.5rem" }}>
        Something went wrong
      </h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
        {error?.message || "An unexpected error occurred while loading this page."}
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => reset()}
          className="btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <RefreshCw size={16} />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="btn-secondary"
          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <ArrowLeft size={16} />
          <span>Return to Home</span>
        </Link>
      </div>
    </div>
  );
}
