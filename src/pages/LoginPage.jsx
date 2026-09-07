import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  ImagePlus,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isAuthenticated, authError } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const FEATURES = [
    { icon: Building2, label: t("login.feature1") },
    { icon: ImagePlus, label: t("login.feature2") },
    { icon: ShieldCheck, label: t("login.feature3") },
  ];

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || t("login.invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="login-brand-mark">
          <div className="sidebar-brand-mark">
            <img src="/logo.jpeg" alt={t("app.brand")} />
          </div>
          {t("app.brand")}
        </div>

        <div className="login-brand-copy">
          <h2>{t("login.heroTitle")}</h2>
          <p>{t("login.heroSubtitle")}</p>
          <ul className="login-brand-features">
            {FEATURES.map((f) => (
              <li key={f.label}>
                <f.icon className="icon" strokeWidth={2} />
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="login-brand-footer">{t("login.footer", { year: new Date().getFullYear() })}</div>
      </div>

      <div className="login-form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-header" style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="badge-soft">
              <ShieldCheck className="icon-sm" />
              {t("login.accessBadge")}
            </span>
            <LanguageSwitcher />
          </div>
          <h1>{t("login.title")}</h1>
          <p className="muted">{t("login.subtitle")}</p>

          {(error || authError) && (
            <div className="alert alert-error">
              <AlertCircle className="icon-sm" />
              <span>{error ? error : t(authError)}</span>
            </div>
          )}

          <label className="field">
            <span>{t("login.username")}</span>
            <div className="field-icon-wrap">
              <User className="icon" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                placeholder={t("login.usernamePlaceholder")}
              />
            </div>
          </label>

          <label className="field">
            <span>{t("login.password")}</span>
            <div className="field-icon-wrap">
              <Lock className="icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="has-trailing-icon"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
              >
                {showPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
              </button>
            </div>
          </label>

          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
