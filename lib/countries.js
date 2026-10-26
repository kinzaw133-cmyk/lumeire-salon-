// International Country Dial Codes and Flag Utilities
// Uses https://flagcdn.com/w20/{iso2}.png so flags render consistently on all OSes (including Windows)

export const COUNTRIES = [
  {
    code: "PK",
    name: "Pakistan",
    dial: "+92",
    placeholder: "300 1234567",
    minDigits: 10,
    maxDigits: 10,
    example: "300 1234567",
  },
  {
    code: "IN",
    name: "India",
    dial: "+91",
    placeholder: "98765 43210",
    minDigits: 10,
    maxDigits: 10,
    example: "98765 43210",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    dial: "+971",
    placeholder: "50 123 4567",
    minDigits: 9,
    maxDigits: 9,
    example: "50 123 4567",
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    dial: "+966",
    placeholder: "50 123 4567",
    minDigits: 9,
    maxDigits: 9,
    example: "50 123 4567",
  },
  {
    code: "GB",
    name: "United Kingdom",
    dial: "+44",
    placeholder: "7911 123456",
    minDigits: 10,
    maxDigits: 10,
    example: "7911 123456",
  },
  {
    code: "US",
    name: "United States",
    dial: "+1",
    placeholder: "555 123-4567",
    minDigits: 10,
    maxDigits: 10,
    example: "555 123-4567",
  },
  {
    code: "CA",
    name: "Canada",
    dial: "+1",
    placeholder: "555 123-4567",
    minDigits: 10,
    maxDigits: 10,
    example: "555 123-4567",
  },
  {
    code: "BD",
    name: "Bangladesh",
    dial: "+880",
    placeholder: "1712 345678",
    minDigits: 10,
    maxDigits: 10,
    example: "1712 345678",
  },
  {
    code: "TR",
    name: "Turkey",
    dial: "+90",
    placeholder: "532 123 4567",
    minDigits: 10,
    maxDigits: 10,
    example: "532 123 4567",
  },
  {
    code: "AU",
    name: "Australia",
    dial: "+61",
    placeholder: "412 345 678",
    minDigits: 9,
    maxDigits: 9,
    example: "412 345 678",
  },
  {
    code: "QA",
    name: "Qatar",
    dial: "+974",
    placeholder: "3312 3456",
    minDigits: 8,
    maxDigits: 8,
    example: "3312 3456",
  },
  {
    code: "KW",
    name: "Kuwait",
    dial: "+965",
    placeholder: "9912 3456",
    minDigits: 8,
    maxDigits: 8,
    example: "9912 3456",
  },
  {
    code: "OM",
    name: "Oman",
    dial: "+968",
    placeholder: "9123 4567",
    minDigits: 8,
    maxDigits: 8,
    example: "9123 4567",
  },
  {
    code: "BH",
    name: "Bahrain",
    dial: "+973",
    placeholder: "3912 3456",
    minDigits: 8,
    maxDigits: 8,
    example: "3912 3456",
  },
  {
    code: "MY",
    name: "Malaysia",
    dial: "+60",
    placeholder: "12 345 6789",
    minDigits: 9,
    maxDigits: 10,
    example: "12 345 6789",
  },
  {
    code: "SG",
    name: "Singapore",
    dial: "+65",
    placeholder: "8123 4567",
    minDigits: 8,
    maxDigits: 8,
    example: "8123 4567",
  },
  {
    code: "DE",
    name: "Germany",
    dial: "+49",
    placeholder: "151 23456789",
    minDigits: 10,
    maxDigits: 11,
    example: "151 23456789",
  },
  {
    code: "FR",
    name: "France",
    dial: "+33",
    placeholder: "6 12 34 56 78",
    minDigits: 9,
    maxDigits: 9,
    example: "6 12 34 56 78",
  },
  {
    code: "IT",
    name: "Italy",
    dial: "+39",
    placeholder: "320 123 4567",
    minDigits: 9,
    maxDigits: 10,
    example: "320 123 4567",
  },
  {
    code: "ES",
    name: "Spain",
    dial: "+34",
    placeholder: "612 345 678",
    minDigits: 9,
    maxDigits: 9,
    example: "612 345 678",
  },
  {
    code: "ZA",
    name: "South Africa",
    dial: "+27",
    placeholder: "71 234 5678",
    minDigits: 9,
    maxDigits: 9,
    example: "71 234 5678",
  },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Pakistan (+92)

/**
 * Validate a phone number for the given country
 */
export function validatePhoneNumber(rawNumber, country = DEFAULT_COUNTRY) {
  if (!rawNumber || typeof rawNumber !== "string") {
    return {
      isValid: false,
      message: "Please enter your phone number.",
    };
  }

  // Remove all non-digits
  const digitsOnly = rawNumber.replace(/\D/g, "");

  // If user entered a leading 0 (common in local mobile dialing like 0300...), strip it
  const cleanLocal = digitsOnly.replace(/^0+/, "");

  if (!cleanLocal) {
    return {
      isValid: false,
      message: "Please enter your phone number.",
    };
  }

  const min = country.minDigits || 7;
  const max = country.maxDigits || 12;

  if (cleanLocal.length < min || cleanLocal.length > max) {
    const digitRule =
      min === max ? `${min} digits` : `between ${min} and ${max} digits`;
    return {
      isValid: false,
      message: `Invalid phone for ${country.name}. Expected ${digitRule} (e.g. ${country.example}).`,
    };
  }

  const fullInternational = `${country.dial}${cleanLocal}`;

  return {
    isValid: true,
    fullInternational,
    cleanLocal,
    dialCode: country.dial,
  };
}

/**
 * Get sanitized tel: link URI compatible with any dialer
 * Works for both new international numbers (+923001234567) and legacy formats (+1 (555) 234-8899, 0300...)
 */
export function getTelUri(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

/**
 * Get image URL for country flag from flagcdn
 */
export function getFlagUrl(iso2Code) {
  const code = String(iso2Code || "").toLowerCase();
  return `https://flagcdn.com/w40/${code}.png`;
}
