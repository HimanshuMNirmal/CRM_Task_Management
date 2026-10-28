import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { Role } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { RoleBadge } from "./Badges";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  to: string;
  label: string;
  roles: Role[];
}

// Which menu links each role sees.
const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
  { to: "/tasks", label: "Tasks", roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
  { to: "/projects", label: "Projects", roles: ["ADMIN", "MANAGER"] },
  { to: "/users", label: "Users", roles: ["ADMIN"] },
  { to: "/teams", label: "Teams", roles: ["ADMIN"] },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-lg font-bold text-indigo-600">TaskManager</span>
            <nav className="flex gap-1 overflow-x-auto">
              {NAV_ITEMS.filter((item) => item.roles.includes(user.role)).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
            <button className="btn-secondary" onClick={() => void handleLogout()}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
