"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global Root Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", textAlign: "center", padding: "5rem 1.5rem" }}>
        <h2>System Error</h2>
        <p>{error?.message || "An unexpected error occurred."}</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.6rem 1.25rem",
            background: "#935ac9",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
