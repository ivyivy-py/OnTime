/**
 * @file LocationCombobox.tsx
 * Free-text location search box: type any Singapore address (backed by real
 * OneMap Singapore geocoding via services/geocode.ts) or pick one of the 8
 * quick presets. Used for both Origin and Destination in PlannerView.
 *
 * This replaces a plain <select> that was hard-locked to the 8 presets —
 * that was a deliberate scope cut when this was first built, but it meant
 * users genuinely could not plan a trip from/to anywhere else, which is the
 * bug being fixed here.
 */

import React, { useEffect, useRef, useState } from 'react';
import { LOCATION_PRESETS, RoutePoint } from '../data/transitData';
import { searchLocationsDebounced, cancelPendingSearch } from '../services/geocode';

interface LocationComboboxProps {
  label: string;
  iconName: string;
  iconColorClass: string;
  value: RoutePoint | null;
  onChange: (point: RoutePoint) => void;
  id: string;
}

export const LocationCombobox: React.FC<LocationComboboxProps> = ({
  label,
  iconName,
  iconColorClass,
  value,
  onChange,
  id,
}) => {
  const [query, setQuery] = useState<string>(value?.name || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [customResults, setCustomResults] = useState<RoutePoint[]>([]);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the visible text in sync when the parent changes selection (e.g. swap).
  useEffect(() => {
    setQuery(value?.name || '');
  }, [value]);

  useEffect(() => {
    return () => cancelPendingSearch();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (text: string) => {
    setQuery(text);
    setIsOpen(true);
    if (text.trim().length < 2) {
      setCustomResults([]);
      setSearchNote(null);
      return;
    }
    setIsSearching(true);
    searchLocationsDebounced(text, (result) => {
      setIsSearching(false);
      setCustomResults(result.points);
      setSearchNote(result.isSimulated ? result.message || 'Search unavailable right now.' : null);
    });
  };

  const handleSelect = (point: RoutePoint) => {
    onChange(point);
    setQuery(point.name);
    setIsOpen(false);
    setCustomResults([]);
  };

  const presetMatches = LOCATION_PRESETS.filter((p) =>
    query.trim().length === 0 ? true : p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]">
        <span className={`material-symbols-outlined text-[20px] ${iconColorClass}`}>{iconName}</span>
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] text-[#434655] font-bold uppercase tracking-wider" htmlFor={id}>
            {label}
          </label>
          <input
            id={id}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Type any Singapore address, or pick a preset..."
            autoComplete="off"
            className="w-full bg-transparent text-[14px] sm:text-[15px] text-[#131b2e] font-semibold focus:outline-none"
          />
        </div>
        {isSearching && <span className="material-symbols-outlined text-[16px] text-[#0037b0] animate-spin">progress_activity</span>}
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-xl bg-white shadow-lg border border-[#dae2fd] py-1.5">
          {presetMatches.length > 0 && (
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#434655]">Quick Presets</div>
          )}
          {presetMatches.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full text-left px-3 py-2 hover:bg-[#f2f3ff] flex items-center gap-2 text-[13px]"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0037b0]">
                {p.type === 'home' ? 'home' : p.type === 'office' ? 'business' : 'directions_subway'}
              </span>
              <span className="font-semibold text-[#131b2e]">{p.name}</span>
              <span className="text-[11px] text-[#434655]">{p.description}</span>
            </button>
          ))}

          {customResults.length > 0 && (
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#434655] border-t border-[#eaedff] mt-1 pt-1.5">
              Search Results (OneMap Singapore)
            </div>
          )}
          {customResults.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full text-left px-3 py-2 hover:bg-[#f2f3ff] flex items-center gap-2 text-[13px]"
            >
              <span className="material-symbols-outlined text-[16px] text-[#bb0112]">location_on</span>
              <span className="font-semibold text-[#131b2e]">{p.name}</span>
            </button>
          ))}

          {searchNote && <p className="px-3 py-1.5 text-[11px] text-[#93000b]">{searchNote}</p>}

          {!isSearching && query.trim().length >= 2 && customResults.length === 0 && presetMatches.length === 0 && !searchNote && (
            <p className="px-3 py-2 text-[12px] text-[#434655]">No matches. Try a different search term.</p>
          )}
        </div>
      )}
    </div>
  );
};
