'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { User, LogOut, ChevronDown, Settings, Loader2 } from 'lucide-react';

export default function ProfileDropdown({ session }) {
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const user = session?.user;
  const displayName = user?.name || 'Student';
  const displayRole = user?.class
    ? `Class ${user.class}`
    : user?.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : 'Student';

  // ── Close on click outside ───────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  function handleProfile() {
    setIsOpen(false);
    router.push('/profile');
  }

  function handleSettings() {
    setIsOpen(false);
    router.push('/settings');
  }

  async function handleLogout() {
    setSigningOut(true);
    await signOut({ redirect: false });
    window.location.href = window.location.origin;
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger — entire name + avatar block is clickable */}
      <button
        id="profile-menu-btn"
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        suppressHydrationWarning={true}
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Name + role (hidden on small screens) */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-foreground leading-tight">{displayName}</p>
          <p className="text-xs text-muted-foreground">{displayRole}</p>
        </div>

        {/* Avatar */}
        <div className="relative h-10 w-10 shrink-0">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20 shadow-sm transition-all duration-150 hover:border-primary/50">
            <img
              alt="Profile"
              className="h-full w-full object-cover"
              src={
                user?.image ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuC0YT5nhftwsOfovnhrb11Wqm_bKO9g85B0QGT2j4TFdfYADrM5HAInhgDCbcx6mvHc0qqwQuo9gzMK_4kC12EDCK_V6MN0TlvmuVp7Pr0CwVs0PX2Bm6RAgx6kjVfJueqQa9JM1sCeWPYXr-y3ssDYe1LP1LUorNYmUtGRm1zpz4yHw6tmrACnFx2_GKCdBpHB9specw94pk8yxs_LY1bg2686Ndyi1M_nJELAkdFwzt2Gp9LhOVUxRZqO1RPtcLVV4pCB4i5HbEuo'
              }
            />
          </div>
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="
            absolute right-0 top-[calc(100%+8px)] z-50
            w-56
            rounded-2xl border border-border bg-card shadow-2xl
            animate-in fade-in slide-in-from-top-2 duration-200
            overflow-hidden
          "
          role="menu"
          aria-label="Profile menu"
        >
          {/* User info header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-primary/20">
              <img
                alt="Profile"
                className="h-full w-full object-cover"
                src={
                  user?.image ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuC0YT5nhftwsOfovnhrb11Wqm_bKO9g85B0QGT2j4TFdfYADrM5HAInhgDCbcx6mvHc0qqwQuo9gzMK_4kC12EDCK_V6MN0TlvmuVp7Pr0CwVs0PX2Bm6RAgx6kjVfJueqQa9JM1sCeWPYXr-y3ssDYe1LP1LUorNYmUtGRm1zpz4yHw6tmrACnFx2_GKCdBpHB9specw94pk8yxs_LY1bg2686Ndyi1M_nJELAkdFwzt2Gp9LhOVUxRZqO1RPtcLVV4pCB4i5HbEuo'
                }
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || displayRole}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <MenuButton
              icon={<User className="h-4 w-4" />}
              label="View Profile"
              onClick={handleProfile}
            />
            <MenuButton
              icon={<Settings className="h-4 w-4" />}
              label="Settings"
              onClick={handleSettings}
            />
          </div>

          {/* Divider + Logout */}
          <div className="border-t border-border p-1.5">
            <button
              id="profile-logout-btn"
              role="menuitem"
              onClick={handleLogout}
              disabled={signingOut}
              className="
                flex w-full items-center gap-3 rounded-lg px-3 py-2
                text-sm font-medium text-red-500
                hover:bg-red-500/10 hover:text-red-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-150
              "
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable menu button ─────────────────────────────────────────────────────

function MenuButton({ icon, label, onClick }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="
        flex w-full items-center gap-3 rounded-lg px-3 py-2
        text-sm font-medium text-foreground
        hover:bg-accent hover:text-accent-foreground
        transition-colors duration-150
      "
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );
}
