import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Receipt } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function openNotification(notif) {
    markAsRead(notif.id);
    setOpen(false);
    navigate(`/transactions?highlight=${notif.id}`);
  }

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("notifications.title")}
      >
        <Bell className="icon" />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>{t("notifications.title")}</span>
            {notifications.length > 0 && (
              <button type="button" className="btn btn-ghost btn-small" onClick={markAllAsRead}>
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="notif-empty">{t("notifications.empty")}</div>
          ) : (
            <div className="notif-list">
              {notifications.map((notif) => (
                <button
                  type="button"
                  key={notif.id}
                  className="notif-item"
                  onClick={() => openNotification(notif)}
                >
                  <span className="notif-item-icon">
                    <Receipt className="icon-sm" />
                  </span>
                  <span className="notif-item-body">
                    <span className="notif-item-title">
                      {t("notifications.newTransaction", { reference: notif.reference })}
                    </span>
                    <span className="notif-item-meta">
                      {notif.bien_reference} — {notif.client_nom || notif.client_username}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
