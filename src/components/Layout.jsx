import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Gift,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Receipt,
  Repeat,
  Sofa,
  Users,
  Waypoints,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

function useNavSections(t) {
  return [
    {
      title: t("nav.sectionComptes"),
      links: [{ to: "/utilisateurs", label: t("nav.utilisateurs"), icon: Users }],
    },
    {
      title: t("nav.sectionLocalisation"),
      links: [
        { to: "/villes", label: t("nav.villes"), icon: MapPin },
        { to: "/quartiers", label: t("nav.quartiers"), icon: Waypoints },
      ],
    },
    {
      title: t("nav.sectionBiens"),
      links: [
        { to: "/biens", label: t("nav.biens"), icon: Building2 },
        { to: "/equipements", label: t("nav.equipements"), icon: Sofa },
        { to: "/indisponibilites", label: t("nav.indisponibilites"), icon: Receipt },
      ],
    },
    {
      title: t("nav.sectionVentes"),
      links: [{ to: "/transactions", label: t("nav.transactions"), icon: Receipt }],
    },
    {
      title: t("nav.sectionFidelite"),
      links: [
        { to: "/cadeaux", label: t("nav.cadeaux"), icon: Gift },
        { to: "/echanges-cadeaux", label: t("nav.echanges"), icon: Repeat },
      ],
    },
    {
      title: t("nav.sectionMarketing"),
      links: [{ to: "/offres", label: t("nav.offres"), icon: Megaphone }],
    },
  ];
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navSections = useNavSections(t);

  const initial = (user?.username || "?").charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={"sidebar" + (mobileOpen ? " open" : "")}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <img src="/logo.jpeg" alt={t("app.brand")} />
          </div>
          <div className="sidebar-brand-text">
            <strong>{t("app.brand")}</strong>
            <span>{t("app.tagline")}</span>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label={t("nav.closeMenu")}
          >
            <X className="icon-sm" />
          </button>
        </div>
        <nav>
          {navSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <div className="nav-section-title">{section.title}</div>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                >
                  <link.icon className="icon" strokeWidth={2} />
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label={t("nav.openMenu")}
          >
            <Menu className="icon" />
          </button>
          <div className="topbar-user">
            <LanguageSwitcher />
            <div className="avatar">{initial}</div>
            <span>{user?.username}</span>
            <button className="btn btn-ghost btn-small" onClick={logout} type="button">
              <LogOut className="icon-sm" />
              {t("nav.logout")}
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
