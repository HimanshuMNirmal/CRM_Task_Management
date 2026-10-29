import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Role } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { RoleBadge } from "./Badges";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  to: string;
  label: string;
  roles: Role[];
  icon: string;
}

// Navigation links with role guards
const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "MANAGER", "EMPLOYEE"], icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { to: "/tasks", label: "Tasks", roles: ["ADMIN", "MANAGER", "EMPLOYEE"], icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { to: "/projects", label: "Projects", roles: ["ADMIN", "MANAGER"], icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { to: "/users", label: "Users", roles: ["ADMIN"], icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { to: "/teams", label: "Teams", roles: ["ADMIN"], icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile drawer when user navigates
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const allowedNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left section: Brand logo and Desktop Navigation */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-black text-white shadow-sm">
                T
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                TaskManager <span className="text-xs font-semibold uppercase text-indigo-600">CRM</span>
              </span>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex md:items-center md:gap-1">
              {allowedNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right section: Notification Bell + User Profile / Logout + Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />

            {/* Desktop User Info & Logout */}
            <div className="hidden md:flex md:items-center md:gap-3 md:border-l md:border-slate-200 md:pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left text-xs">
                <p className="max-w-[140px] truncate font-semibold text-slate-800 leading-tight">{user.name}</p>
                <div className="mt-0.5">
                  <RoleBadge role={user.role} />
                </div>
              </div>
              <button
                className="btn-secondary ml-1 py-1 px-3 text-xs font-medium"
                onClick={() => void handleLogout()}
              >
                Log out
              </button>
            </div>

            {/* Mobile Menu Hamburger / Close Button */}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 shadow-xl md:hidden">
            {/* User Profile Card on Mobile */}
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
                <div className="mt-1">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <nav className="space-y-1">
              {allowedNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-50 font-semibold text-indigo-700 shadow-xs"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <svg className="h-5 w-5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Mobile Logout Button */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/50 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                onClick={() => void handleLogout()}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Container with zero horizontal overflow */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
