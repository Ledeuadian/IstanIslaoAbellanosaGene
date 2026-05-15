// ==========================================
// SEARCH BAR COMPONENT
// ==========================================

import React, { useState, useCallback, useEffect } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchBar({
  placeholder = "Search family members...",
  onSearch,
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Detect mobile screens
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(query);
    },
    [query, onSearch]
  );

  // Collapsible toggle for mobile
  if (isMobile && isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className={`flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-colors border border-gray-300 ${className}`}
        aria-label="Expand search"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-sm text-gray-500">Search</span>
      </button>
    );
  }

  return (
    <div className={`${className} ${isMobile ? 'z-50' : ''}`}>
      <form onSubmit={handleSubmit} className={`flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${isMobile ? 'bg-white shadow-lg' : ''}`}>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isMobile ? "Search..." : placeholder}
            className={`w-full ${isMobile ? 'pl-10 pr-12 py-1.5 text-sm' : 'pl-10 pr-12 py-2'} focus:outline-none rounded-lg`}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-8 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors text-sm"
        >
          {isMobile ? 'Go' : 'Search'}
        </button>
      </form>

      {/* Collapse button for mobile */}
      {isMobile && (
        <button
          onClick={() => {
            setIsCollapsed(true);
            setQuery("");
            onSearch("");
          }}
          className="absolute -top-8 right-0 p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Collapse search"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}