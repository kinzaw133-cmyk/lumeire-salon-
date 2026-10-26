// Salon configuration and shared helpers
export const SALON_NAME = "Lumière Salon";
export const SALON_TAGLINE = "Haute Coiffure & Esthétique";
export const SALON_PHONE = "+1 (555) 789-4321";
export const SALON_ADDRESS = "182 Lavender Boulevard, Suite 4B";
export const SALON_HOURS = "Mon – Sun • 10:00 AM – 7:00 PM";

export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 19;
export const SLOT_MINUTES = 60;
export const CLOSED_DAYS = []; // Open 7 days a week

export const SERVICES = [
  {
    id: "haircut",
    name: "Haircut & Bespoke Style",
    category: "Hair",
    price: "Rs 1,500",
    priceNum: 1500,
    mins: 45,
    minutes: 45,
    icon: "✂️",
    iconName: "Scissors",
    description: "Personalized consultation, luxury hair bath, precision cut & blowout styling.",
    perks: [
      "Diagnostic scalp analysis & hair texture consultation",
      "Essential botanical oil hair bath & head massage",
      "Precision bespoke scissor cut & customized styling",
      "Complimentary thermal protection & silk blowout finish",
    ],
  },
  {
    id: "colour",
    name: "Balayage & Hair Gloss",
    category: "Hair",
    price: "Rs 5,000",
    priceNum: 5000,
    mins: 120,
    minutes: 120,
    icon: "✨",
    iconName: "Sparkles",
    description: "Custom hand-painted French balayage or root-to-tip tint with luminous gloss.",
    perks: [
      "Custom color harmony matching & toning formulation",
      "Ammonia-free French botanical lightening clay",
      "High-shine acidic gloss glaze for 8-week mirror shine",
      "Deep moisture bond-building restorative mask",
    ],
  },
  {
    id: "facial",
    name: "Botanical Glow Facial",
    category: "Skin",
    price: "Rs 2,500",
    priceNum: 2500,
    mins: 60,
    minutes: 60,
    icon: "🌸",
    iconName: "Flower2",
    description: "Ultrasonic deep cleanse, enzymatic exfoliation & hydrating lavender essence mask.",
    perks: [
      "Ultrasonic pore extraction & diamond micro-cleansing",
      "Enzymatic papaya-lavender peel for luminous renewal",
      "Cryo-globe lymphatic facial drainage contouring",
      "24k gold infused organic rosehip hydration seal",
    ],
  },
  {
    id: "mani",
    name: "Deluxe Gel Manicure",
    category: "Nails",
    price: "Rs 1,200",
    priceNum: 1200,
    mins: 45,
    minutes: 45,
    icon: "💅",
    iconName: "Gem",
    description: "Cuticle treatment, organic rose-lavender scrub, hand massage & high-shine gel polish.",
    perks: [
      "Nail sculpting, cuticle nourishing treatment & buffing",
      "Warm lavender sugar scrub & warm towel compress",
      "Relaxing acupressure hand & forearm massage",
      "Long-wearing chip-resistant gel polish with LED curing",
    ],
  },
  {
    id: "bridal",
    name: "Signature Bridal Glam",
    category: "Glamour",
    price: "Rs 15,000",
    priceNum: 15000,
    mins: 150,
    minutes: 150,
    icon: "👑",
    iconName: "Crown",
    description: "High-definition bridal makeup, couture hair sculpting, lash application & setting.",
    perks: [
      "HD waterproof bridal airbrush or silk foundation match",
      "Intricate couture bridal hair sculpting & veil placement",
      "Mink lash artistry & customized eye contouring",
      "Full luxury touch-up kit including artisan lipstick sample",
    ],
  },
];

// Available hourly appointment slots
export const SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const KEY = "salon-bookings";

/**
 * Format 24h string "14:00" to "2:00 PM"
 */
export function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Get current date string formatted as YYYY-MM-DD
 */
export function todayStr(offsetDays = 0) {
  const d = new Date();
  if (offsetDays) {
    d.setDate(d.getDate() + offsetDays);
  }
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Read bookings from localStorage without demo seeding
 */
export function getBookings() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((b) => !b.id || !b.id.startsWith("bk-demo"));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Save bookings list to localStorage
 */
export function saveBookings(list) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save bookings", err);
  }
}

/**
 * Format date string "2026-10-23" to readable "Fri, 23 Oct 2026"
 */
export function prettyDate(s) {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
