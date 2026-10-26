"use client";

export const THEMES = [
  {
    id: "lilac",
    name: "Lavender Mist",
    tagline: "Soft Lilac",
    accent: "#9055C8",
    bgPreview: "linear-gradient(135deg, #f4ecf9 0%, #e5d4f3 100%)",
    icon: "Flower2",
  },
  {
    id: "rose",
    name: "Rose Quartz",
    tagline: "Blush Silk",
    accent: "#D84B72",
    bgPreview: "linear-gradient(135deg, #fde8ee 0%, #fbd3de 100%)",
    icon: "Sparkles",
  },
  {
    id: "sage",
    name: "Sage Leaf",
    tagline: "Mint Whisper",
    accent: "#3B8751",
    bgPreview: "linear-gradient(135deg, #e8f5ec 0%, #d1ebda 100%)",
    icon: "Leaf",
  },
  {
    id: "sand",
    name: "Warm Sand",
    tagline: "Cashmere Cream",
    accent: "#B88636",
    bgPreview: "linear-gradient(135deg, #f4efe4 0%, #e9dec9 100%)",
    icon: "Sun",
  },
];

const THEME_KEY = "lumiere-salon-theme";

export function getActiveTheme() {
  if (typeof window === "undefined") return "lilac";
  return localStorage.getItem(THEME_KEY) || "lilac";
}

export function setActiveTheme(themeId) {
  if (typeof window === "undefined") return;
  const valid = THEMES.some((t) => t.id === themeId);
  const id = valid ? themeId : "lilac";
  localStorage.setItem(THEME_KEY, id);
  document.documentElement.setAttribute("data-theme", id);
  return id;
}

export function initTheme() {
  if (typeof window === "undefined") return "lilac";
  const stored = localStorage.getItem(THEME_KEY) || "lilac";
  document.documentElement.setAttribute("data-theme", stored);
  return stored;
}
