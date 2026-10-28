import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/endpoints";
import { connectSocket } from "../api/socket";
import type { AppNotification } from "../api/types";
import { formatDateTime } from "../utils/format";

const MAX_ITEMS = 30; // same limit as the API list

/** Bell icon in the header: unread count + dropdown list. The server pushes new notifications over Socket.IO. */
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
      if (container.current && !container.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
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
    <div className="relative" ref={container}>
      <button
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
        onClick={() => {
          setOpen((o) => !o);
          void refresh();
        }}
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="card absolute right-0 z-30 mt-2 w-80 max-w-[90vw]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <button className="text-xs text-indigo-600 hover:underline disabled:text-slate-400" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all as read
            </button>
          </div>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No notifications</li>}
            {items.map((n) => (
              <li key={n._id}>
                <button
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${n.read ? "" : "bg-indigo-50"}`}
                  onClick={() => void openNotification(n)}
                >
                  <p className="text-sm text-slate-800">{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(n.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
