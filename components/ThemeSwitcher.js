"use client";

import { useEffect, useState } from "react";
import { Flower2, Sparkles, Leaf, Sun, Palette, Check } from "lucide-react";
import { THEMES, getActiveTheme, setActiveTheme } from "../lib/theme";
import { showToast } from "../lib/alerts";

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState("lilac");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const t = getActiveTheme();
    setCurrentTheme(t);
  }, []);

  function handleSelect(themeId) {
    const chosen = setActiveTheme(themeId);
    setCurrentTheme(chosen);
    setIsOpen(false);
    const themeObj = THEMES.find((t) => t.id === themeId);
    showToast(
      `Theme: ${themeObj?.name || themeId}`,
      "success",
      `Switched to ${themeObj?.tagline} aesthetic`
    );
  }

  function getIcon(iconName, size = 15) {
    switch (iconName) {
      case "Flower2":
        return <Flower2 size={size} />;
      case "Sparkles":
        return <Sparkles size={size} />;
      case "Leaf":
        return <Leaf size={size} />;
      case "Sun":
        return <Sun size={size} />;
      default:
        return <Sparkles size={size} />;
    }
  }

  const activeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <div className="theme-switcher-wrapper">
      {/* Quick Pills on Desktop */}
      <div className="theme-pills-bar glass-morphism">
        <span className="theme-pills-label">
          <Palette size={13} />
          <span>Soft Theme:</span>
        </span>
        {THEMES.map((t) => {
          const isActive = currentTheme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className={`theme-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => handleSelect(t.id)}
              title={`${t.name} (${t.tagline})`}
              aria-label={`Switch to ${t.name} theme`}
            >
              <span
                className="theme-pill-dot"
                style={{ background: t.accent }}
              />
              <span className="theme-pill-name">{t.name.split(" ")[0]}</span>
              {isActive && <Check size={12} className="theme-pill-check" />}
            </button>
          );
        })}
      </div>

      {/* Mobile Dropdown Trigger */}
      <div className="theme-mobile-menu">
        <button
          type="button"
          className="theme-mobile-trigger glass-morphism"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Change soft theme"
        >
          <span
            className="theme-pill-dot"
            style={{ background: activeObj.accent }}
          />
          <span className="theme-mobile-title">{activeObj.name}</span>
          <Palette size={14} />
        </button>

        {isOpen && (
          <div className="theme-mobile-dropdown glass-morphism">
            {THEMES.map((t) => {
              const isActive = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-dropdown-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelect(t.id)}
                >
                  <div className="theme-dropdown-info">
                    <span
                      className="theme-pill-dot"
                      style={{ background: t.accent }}
                    />
                    <div>
                      <div className="theme-dropdown-name">{t.name}</div>
                      <div className="theme-dropdown-sub">{t.tagline}</div>
                    </div>
                  </div>
                  {isActive && <Check size={14} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
