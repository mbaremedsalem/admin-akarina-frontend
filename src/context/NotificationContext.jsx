import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const BASELINE_KEY = "agharina_admin_notif_baseline_id";
const READ_IDS_KEY = "agharina_admin_notif_read_ids";
const POLL_INTERVAL_MS = 20000;

function readBaseline() {
  const raw = localStorage.getItem(BASELINE_KEY);
  return raw ? Number(raw) : null;
}

function writeBaseline(id) {
  localStorage.setItem(BASELINE_KEY, String(id));
}

function readReadIds() {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeReadIds(set) {
  localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(set)));
}

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [readIds, setReadIds] = useState(() => readReadIds());
  const baselineRef = useRef(readBaseline());

  useEffect(() => {
    if (!isAuthenticated) {
      setTransactions([]);
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const data = await api.list("/transactions/");
        if (cancelled) return;
        if (baselineRef.current === null) {
          const maxId = data.reduce((max, t) => Math.max(max, t.id), 0);
          baselineRef.current = maxId;
          writeBaseline(maxId);
        }
        setTransactions(data);
      } catch {
        // Silently ignore polling failures (e.g. transient network blips).
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const notifications = useMemo(() => {
    const baseline = baselineRef.current ?? 0;
    return transactions
      .filter((t) => t.id > baseline && !readIds.has(t.id))
      .sort((a, b) => b.id - a.id);
  }, [transactions, readIds]);

  function markAsRead(id) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeReadIds(next);
      return next;
    });
  }

  function markAllAsRead() {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      writeReadIds(next);
      return next;
    });
  }

  const value = {
    notifications,
    unreadCount: notifications.length,
    markAsRead,
    markAllAsRead,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications doit etre utilise dans un NotificationProvider");
  return ctx;
}
