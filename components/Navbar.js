"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  CalendarPlus,
  ShieldCheck,
} from "lucide-react";
import { SALON_NAME, SALON_TAGLINE } from "../lib/config";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Navbar() {
  const pathname = usePathname();

  // Links in the exact requested order:
  // 1. Dashboard (/dashboard)
  // 2. Book Appointment (/)
  // 3. Owner View (/admin)
  const navLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Book Appointment",
      href: "/",
      icon: CalendarPlus,
    },
    {
      label: "Owner View",
      href: "/admin",
      icon: ShieldCheck,
    },
  ];

  return (
    <header className="site-navbar" role="banner">
      <div className="navbar-container">
        {/* Salon Brand (Left) */}
        <Link href="/" className="navbar-brand" aria-label={`${SALON_NAME} - Home`}>
          <div className="navbar-brand-emblem">
            <Sparkles size={18} />
          </div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-title">{SALON_NAME}</span>
            <span className="navbar-brand-tagline">{SALON_TAGLINE}</span>
          </div>
        </Link>

        {/* Horizontal Navigation Links & Theme Switcher (Right) */}
        <div className="navbar-actions-group">
          {/* Always horizontal, single-row scrollable on mobile */}
          <nav
            className="navbar-links-row"
            role="navigation"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`navbar-nav-item ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={20} className="nav-item-icon" />
                  <span className="nav-item-text">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme switcher pill / menu */}
          <div className="navbar-theme-box">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
