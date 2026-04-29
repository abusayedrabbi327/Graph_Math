import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BarChart3, Search, Sun, Moon, User, X } from 'lucide-react';
import type { ViewMode } from '../types';
import type { AppTheme } from '../theme';
import { ALL_PRESETS } from '../constants';

interface TopNavProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  theme: AppTheme;
  onSearchSelect: (expr: string, mode: '2D' | '3D') => void;
}

export function TopNav({ viewMode, setViewMode, darkMode, setDarkMode, theme, onSearchSelect }: TopNavProps) {
  const [searchValue, setSearchValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filtered = searchValue.trim().length > 0
    ? ALL_PRESETS.filter(p =>
        p.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        p.expr.toLowerCase().includes(searchValue.toLowerCase()) ||
        p.category.toLowerCase().includes(searchValue.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback((expr: string, mode: '2D' | '3D') => {
    onSearchSelect(expr, mode);
    setSearchValue('');
    setShowDropdown(false);
  }, [onSearchSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setSearchValue(''); setShowDropdown(false); }
    if (e.key === 'Enter' && filtered.length > 0) {
      handleSelect(filtered[0].expr, filtered[0].mode);
    }
  };

  return (
    <header
      className="flex items-center gap-4 px-4 shrink-0 relative"
      style={{ height: 52, background: theme.bgPanel, borderBottom: `1px solid ${theme.border}` }}
    >
      {/* Subtle gradient accent line at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 0%, #6366f1 30%, #22d3ee 60%, transparent 100%)',
        opacity: 0.35,
      }} />
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}
        >
          <BarChart3 size={16} color="#fff" />
        </div>
        <span style={{ fontSize: '15px', fontWeight: 600, color: theme.textPrimary, letterSpacing: '-0.02em' }}>
          Graph<span style={{ color: '#6366f1' }}>Math</span>
        </span>
      </div>

      {/* Search */}
      <div ref={searchRef} className="flex-1 relative" style={{ maxWidth: 360, margin: '0 auto' }}>
        <div
          className="flex items-center gap-2 w-full rounded-lg px-3"
          style={{
            height: 34,
            background: theme.bgInput,
            border: `1px solid ${showDropdown && searchValue ? theme.accent : theme.borderLight}`,
            transition: 'border-color 0.15s',
          }}
        >
          <Search size={13} style={{ color: theme.textMuted, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search equations, functions… (e.g. sine, paraboloid)"
            value={searchValue}
            onChange={e => { setSearchValue(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: '12px', color: theme.textPrimary, minWidth: 0 }}
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(''); setShowDropdown(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && filtered.length > 0 && (
          <div
            className="absolute left-0 right-0 rounded-lg overflow-hidden z-50"
            style={{
              top: 38,
              background: theme.bgPanel,
              border: `1px solid ${theme.borderLight}`,
              boxShadow: darkMode
                ? '0 8px 32px rgba(0,0,0,0.6)'
                : '0 8px 32px rgba(99,102,241,0.15)',
            }}
          >
            {filtered.map((preset, i) => (
              <button
                key={i}
                className="flex items-center justify-between w-full px-3 py-2.5 text-left transition-colors"
                onClick={() => handleSelect(preset.expr, preset.mode)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: i < filtered.length - 1 ? `1px solid ${theme.border}` : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = theme.bgInput)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span style={{ fontSize: '12px', color: theme.textSecondary, fontFamily: 'monospace', flexShrink: 0 }}>
                    {preset.expr}
                  </span>
                  <span style={{ fontSize: '11px', color: theme.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    — {preset.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span style={{ fontSize: '9px', color: theme.textMuted }}>{preset.category}</span>
                  <span
                    className="px-1.5 py-0.5 rounded"
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      color: preset.mode === '3D' ? '#22d3ee' : '#a5b4fc',
                      background: preset.mode === '3D' ? 'rgba(34,211,238,0.12)' : 'rgba(99,102,241,0.12)',
                    }}
                  >
                    {preset.mode}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && searchValue.trim().length > 0 && filtered.length === 0 && (
          <div
            className="absolute left-0 right-0 rounded-lg z-50 px-4 py-3"
            style={{
              top: 38,
              background: theme.bgPanel,
              border: `1px solid ${theme.borderLight}`,
              fontSize: '12px',
              color: theme.textMuted,
            }}
          >
            No results for "{searchValue}"
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View Toggles */}
      <div
        className="flex items-center rounded-lg p-0.5 shrink-0"
        style={{ background: theme.bgInput, border: `1px solid ${theme.borderLight}`, gap: 2 }}
      >
        {(['2D', '3D', 'split'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="rounded-md transition-all"
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: viewMode === mode ? 600 : 400,
              color: viewMode === mode ? '#fff' : theme.textMuted,
              background: viewMode === mode
                ? mode === '2D' ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                : mode === '3D' ? 'linear-gradient(135deg, #0891b2, #22d3ee)'
                : 'linear-gradient(135deg, #6d28d9, #a78bfa)'
                : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {mode === 'split' ? 'Split' : mode}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: theme.border }} />

      {/* Theme Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="flex items-center justify-center rounded-lg transition-colors"
        style={{
          width: 32, height: 32,
          background: theme.bgInput,
          border: `1px solid ${theme.borderLight}`,
          cursor: 'pointer',
          color: darkMode ? '#a78bfa' : '#f59e0b',
        }}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? <Moon size={14} /> : <Sun size={14} />}
      </button>

      {/* User Avatar */}
      <div
        className="flex items-center justify-center rounded-full overflow-hidden shrink-0"
        style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', cursor: 'pointer' }}
      >
        <User size={14} color="#fff" />
      </div>
    </header>
  );
}
