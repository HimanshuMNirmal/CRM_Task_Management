import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/endpoints";
import { connectSocket } from "../api/socket";
import type { AppNotification } from "../api/types";
import { formatDateTime } from "../utils/format";

const MAX_ITEMS = 30; // same limit as the API list

/** Bell icon in the header: unread count + dropdown list. Responsive on all screen sizes. */
export function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await notificationsApi.list();
      setItems(result.items);
      setUnreadCount(result.unreadCount);
    } catch {
      // Ignore: we refresh again on the next reconnect or when the dropdown opens.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const socket = connectSocket();
    socket.on("notification:new", (n: AppNotification) => {
      setItems((prev) => [n, ...prev].slice(0, MAX_ITEMS));
      setUnreadCount((c) => c + 1);
    });
    // Read state changed in another tab.
    socket.on("notifications:updated", () => void refresh());
    // Catch up on anything sent while we were disconnected.
    socket.io.on("reconnect", () => void refresh());
    return () => {
      socket.disconnect();
    };
  }, [refresh]);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (container.current && !container.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function openNotification(n: AppNotification) {
    if (!n.read) await notificationsApi.markRead(n._id).catch(() => undefined);
    setOpen(false);
    await refresh();
    navigate(`/tasks/${n.task}`);
  }

  async function markAllRead() {
    await notificationsApi.markAllRead();
    await refresh();
  }

  return (
    <div className="relative inline-block" ref={container}>
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onClick={() => {
          setOpen((o) => !o);
          void refresh();
        }}
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px] sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Notification Panel: fixed & centered on mobile, absolute docked on sm+ */}
          <div className="fixed inset-x-3 top-16 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-96 sm:w-84 sm:max-w-sm sm:rounded-lg sm:shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </button>
                <button
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 sm:hidden"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                >
                  &times;
                </button>
              </div>
            </div>

            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {items.length === 0 && (
                <li className="flex flex-col items-center justify-center px-4 py-8 text-center text-slate-400">
                  <svg className="mb-2 h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-sm font-medium">No notifications yet</p>
                </li>
              )}
              {items.map((n) => (
                <li key={n._id}>
                  <button
                    className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none ${
                      n.read ? "bg-white" : "bg-indigo-50/60"
                    }`}
                    onClick={() => void openNotification(n)}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm break-words ${n.read ? "text-slate-700" : "font-semibold text-slate-900"}`}>
                          {n.message}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
