"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY } from "../lib/countries";

/**
 * CountryFlag helper component
 * Renders real flag images from flagcdn with 2x srcSet and fallback badge on load error
 */
function CountryFlag({ code, name }) {
  const [hasError, setHasError] = useState(false);
  const iso2 = (code || "").toLowerCase();

  // Reset error when country code changes
  useEffect(() => {
    setHasError(false);
  }, [code]);

  if (hasError || !iso2) {
    return (
      <span className="phone-flag-fallback" aria-hidden="true" title={name || code}>
        {code}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${iso2}.png`}
      srcSet={`https://flagcdn.com/w80/${iso2}.png 2x`}
      width={24}
      height={18}
      alt=""
      loading="lazy"
      onError={() => setHasError(true)}
      className="phone-flag-img"
    />
  );
}

export default function PhoneInput({
  id = "client-phone",
  value = "",
  onChange,
  selectedCountry = DEFAULT_COUNTRY,
  onCountryChange,
  error = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const searchInputRef = useRef(null);
  const numberInputRef = useRef(null);
  const optionsListRef = useRef(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Filter countries by name, dial code, or ISO code
  const filteredCountries = COUNTRIES.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  // Focus search input and sync highlighted index when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const idx = filteredCountries.findIndex((c) => c.code === selectedCountry.code);
      setHighlightedIndex(idx >= 0 ? idx : 0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Reset highlight index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (isOpen && optionsListRef.current) {
      const activeEl = optionsListRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  function handleSelectCountry(country) {
    if (onCountryChange) {
      onCountryChange(country);
    }
    setIsOpen(false);
    numberInputRef.current?.focus();
  }

  function handleButtonKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(true);
    }
  }

  function handleListKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredCountries.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCountries.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCountries[highlightedIndex]) {
        handleSelectCountry(filteredCountries[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  }

  function handleNumberChange(e) {
    const val = e.target.value;
    // Allow digits, spaces, and hyphens only
    const cleaned = val.replace(/[^\d\s-]/g, "");
    if (onChange) {
      onChange(cleaned);
    }
  }

  const listboxId = `${id}-country-listbox`;
  const activeDescendantId =
    filteredCountries[highlightedIndex]
      ? `${id}-opt-${filteredCountries[highlightedIndex].code}`
      : undefined;

  return (
    <div className="phone-input-component" ref={dropdownRef}>
      <div className={`phone-input-row ${error ? "has-error" : ""}`}>
        {/* Accessible Country Selector Combobox Button */}
        <button
          ref={buttonRef}
          type="button"
          id={`${id}-country-btn`}
          className="phone-country-btn"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-label={`Select country code, currently ${selectedCountry.name} ${selectedCountry.dial}`}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleButtonKeyDown}
        >
          <CountryFlag code={selectedCountry.code} name={selectedCountry.name} />
          <span className="phone-dial-code">{selectedCountry.dial}</span>
          <ChevronDown
            size={14}
            className={`phone-chevron ${isOpen ? "rotate" : ""}`}
            aria-hidden="true"
          />
        </button>

        {/* Local Number Input */}
        <div className="phone-number-field-wrapper">
          <input
            ref={numberInputRef}
            id={id}
            type="tel"
            className="phone-number-input"
            placeholder={selectedCountry.placeholder || "300 1234567"}
            value={value}
            onChange={handleNumberChange}
            autoComplete="tel-national"
            aria-required="true"
            aria-invalid={!!error}
          />
        </div>
      </div>

      {/* Accessible Searchable Dropdown Popover */}
      {isOpen && (
        <div
          id={listboxId}
          className="phone-dropdown-menu glass-morphism"
          role="listbox"
          aria-label="Country list"
          aria-activedescendant={activeDescendantId}
        >
          {/* Search Box with keyboard navigation */}
          <div className="phone-search-wrapper">
            <Search size={14} className="phone-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              className="phone-search-input"
              placeholder="Search country or dial code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleListKeyDown}
              aria-label="Search countries"
              aria-autocomplete="list"
              aria-controls={listboxId}
            />
          </div>

          {/* Countries List */}
          <div className="phone-options-list" ref={optionsListRef}>
            {filteredCountries.length === 0 ? (
              <div className="phone-no-results">
                No matching countries found
              </div>
            ) : (
              filteredCountries.map((c, index) => {
                const isSelected = c.code === selectedCountry.code;
                const isHighlighted = index === highlightedIndex;
                const optId = `${id}-opt-${c.code}`;

                return (
                  <button
                    key={c.code}
                    id={optId}
                    data-index={index}
                    type="button"
                    className={`phone-option-item ${isSelected ? "selected" : ""} ${
                      isHighlighted ? "highlighted" : ""
                    }`}
                    onClick={() => handleSelectCountry(c)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="phone-option-left">
                      <CountryFlag code={c.code} name={c.name} />
                      <span className="phone-option-name">{c.name}</span>
                    </div>
                    <div className="phone-option-right">
                      <span className="phone-option-dial">{c.dial}</span>
                      {isSelected && (
                        <Check size={14} className="phone-check-icon" aria-hidden="true" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
