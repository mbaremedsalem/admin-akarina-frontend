import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, KeyRound, Lock, ShieldCheck, User, Users, X } from "lucide-react";
import { api } from "../api/client";
import ResourcePage from "../components/ResourcePage";
import Modal from "../components/Modal";

function Badge({ on, labelOn, labelOff }) {
  return (
    <span className={"badge " + (on ? "badge-on" : "badge-off")}>
      {on ? <Check className="icon-sm" /> : <X className="icon-sm" />}
      {on ? labelOn : labelOff}
    </span>
  );
}

function ResetPasswordForm({ utilisateur, onDone, onCancel }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("users.resetPasswordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/utilisateurs/${utilisateur.id}/reinitialiser-mot-de-passe/`, {
        nouveau_mot_de_passe: password,
      });
      onDone();
    } catch (err) {
      setError(err.message || t("common.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="resource-form">
      <p className="muted" style={{ marginBottom: "0.5rem" }}>
        {t("users.resetPasswordFor", { username: utilisateur.username })}
      </p>

      {error && (
        <div className="alert alert-error">
          <AlertCircle className="icon-sm" />
          <span>{error}</span>
        </div>
      )}

      <label className="field">
        <span>{t("users.newPassword")} *</span>
        <div className="field-icon-wrap">
          <Lock className="icon" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
          />
        </div>
      </label>

      <label className="field">
        <span>{t("users.confirmPassword")} *</span>
        <div className="field-icon-wrap">
          <Lock className="icon" />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? t("common.saving") : t("users.resetPasswordSubmit")}
        </button>
      </div>
    </form>
  );
}

export default function UtilisateursPage() {
  const { t } = useTranslation();
  const [resetTarget, setResetTarget] = useState(null);
  const [resetDone, setResetDone] = useState(false);

  const columns = [
    {
      key: "username",
      label: t("users.colUser"),
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
          <User className="icon-sm muted" />
          {row.username}
        </span>
      ),
    },
    {
      key: "nom",
      label: t("users.colName"),
      render: (row) => [row.first_name, row.last_name].filter(Boolean).join(" ") || "-",
    },
    { key: "email", label: t("users.colEmail") },
    { key: "telephone", label: t("users.colPhone"), render: (row) => row.telephone || "-" },
    {
      key: "est_gestionnaire",
      label: t("users.colManager"),
      render: (row) => <Badge on={row.est_gestionnaire} labelOn={t("common.yes")} labelOff={t("common.no")} />,
    },
    {
      key: "is_staff",
      label: t("users.colAdmin"),
      render: (row) => <Badge on={row.is_staff} labelOn={t("users.badgeAdmin")} labelOff={t("users.badgeUser")} />,
    },
    {
      key: "is_active",
      label: t("users.colStatus"),
      render: (row) => (
        <Badge on={row.is_active} labelOn={t("users.badgeActive")} labelOff={t("users.badgeDisabled")} />
      ),
    },
    { key: "points_fidelite", label: t("users.colPoints") },
  ];

  const fields = [
    { key: "first_name", label: t("users.fieldFirstName"), icon: User },
    { key: "last_name", label: t("users.fieldLastName"), icon: User },
    { key: "email", label: t("users.fieldEmail"), type: "email" },
    { key: "telephone", label: t("users.fieldPhone") },
    { key: "est_gestionnaire", label: t("users.fieldManager"), type: "checkbox" },
    { key: "is_staff", label: t("users.fieldStaff"), type: "checkbox" },
    { key: "is_active", label: t("users.fieldActive"), type: "checkbox" },
  ];

  return (
    <>
      <ResourcePage
        title={t("users.title")}
        titleIcon={Users}
        endpoint="/utilisateurs/"
        columns={columns}
        fields={fields}
        canCreate={false}
        emptyMessage={t("users.empty")}
        emptyIcon={Users}
        toolbarExtra={
          <p className="muted toolbar-note">
            <ShieldCheck className="icon-sm" style={{ display: "inline", verticalAlign: "-2px" }} />{" "}
            {t("users.note")}
          </p>
        }
        rowActions={(row) => (
          <button type="button" className="btn btn-small" onClick={() => setResetTarget(row)}>
            <KeyRound className="icon-sm" />
            {t("users.resetPassword")}
          </button>
        )}
      />

      {resetTarget && !resetDone && (
        <Modal title={t("users.resetPasswordTitle")} onClose={() => setResetTarget(null)} width="420px">
          <ResetPasswordForm
            utilisateur={resetTarget}
            onDone={() => setResetDone(true)}
            onCancel={() => setResetTarget(null)}
          />
        </Modal>
      )}

      {resetTarget && resetDone && (
        <Modal
          title={t("users.resetPasswordTitle")}
          onClose={() => {
            setResetTarget(null);
            setResetDone(false);
          }}
          width="420px"
        >
          <div className="alert" style={{ background: "var(--success-light)", color: "var(--success-text)", border: "none" }}>
            <ShieldCheck className="icon-sm" />
            <span>{t("users.resetPasswordSuccess")}</span>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setResetTarget(null);
                setResetDone(false);
              }}
            >
              {t("common.close")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
