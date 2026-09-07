import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarOff,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { api } from "../api/client";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import Modal from "../components/Modal";
import ResourceForm from "../components/ResourceForm";

function typeBienLabel(t, type) {
  return {
    ceremonie: t("biens.typeCeremonie"),
    duplexe: t("biens.typeDuplexe"),
    appartement: t("biens.typeAppartement"),
    terrain: t("biens.typeTerrain"),
    commercial: t("biens.typeCommercial"),
  }[type] ?? type;
}

function typeTransactionLabel(t, type) {
  return { vente: t("bienForm.typeVente"), location: t("bienForm.typeLocation") }[type] ?? type;
}

export default function IndisponibilitesPage() {
  const { t } = useTranslation();
  const [refInput, setRefInput] = useState("");
  const [bien, setBien] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [modal, setModal] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    const ref = refInput.trim();
    if (!ref) return;
    setSearching(true);
    setSearchError(null);
    try {
      const data = await api.get(`/biens/${encodeURIComponent(ref)}/`);
      setBien(data);
    } catch (err) {
      setBien(null);
      setSearchError(t("indisponibilites.searchNotFound"));
    } finally {
      setSearching(false);
    }
  }

  function reset() {
    setBien(null);
    setRefInput("");
    setSearchError(null);
  }

  async function reloadBien() {
    const data = await api.get(`/biens/${bien.reference}/`);
    setBien(data);
  }

  async function handleCreate(values) {
    await api.post("/indisponibilites/", { ...values, bien: bien.id });
    setModal(null);
    reloadBien();
  }

  async function handleEdit(row, values) {
    await api.patch(`/indisponibilites/${row.id}/`, values);
    setModal(null);
    reloadBien();
  }

  async function handleDelete(row) {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await api.del(`/indisponibilites/${row.id}/`);
      reloadBien();
    } catch (err) {
      window.alert(err.message);
    }
  }

  const periodFields = [
    { key: "date_debut", label: t("indisponibilites.fieldStart"), type: "date", required: true },
    { key: "date_fin", label: t("indisponibilites.fieldEnd"), type: "date", required: true },
    {
      key: "motif",
      label: t("indisponibilites.fieldReason"),
      icon: MessageSquare,
      placeholder: t("indisponibilites.fieldReasonPlaceholder"),
    },
  ];

  return (
    <div className="resource-page">
      <div className="page-header">
        <h1>
          <span className="page-header-icon">
            <CalendarOff className="icon" strokeWidth={2} />
          </span>
          {t("indisponibilites.title")}
        </h1>
      </div>

      <form onSubmit={handleSearch} className="bien-search-form">
        <div className="field-icon-wrap">
          <Search className="icon" />
          <input
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder={t("indisponibilites.searchPlaceholder")}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={searching}>
          {t("indisponibilites.searchButton")}
        </button>
      </form>

      {!bien && !searchError && <p className="muted">{t("indisponibilites.searchHint")}</p>}

      {searchError && (
        <div className="alert alert-error">
          <AlertCircle className="icon-sm" />
          <span>{searchError}</span>
        </div>
      )}

      {bien && (
        <>
          <div className="bien-summary-card">
            <div>
              <div className="bien-summary-title">{bien.titre}</div>
              <span className="muted" style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                {bien.reference}
              </span>{" "}
              <span className="muted">
                &middot; {typeBienLabel(t, bien.type_bien)} &middot; {typeTransactionLabel(t, bien.type_transaction)}
              </span>
            </div>
            <button type="button" className="btn btn-small" onClick={reset}>
              <RotateCcw className="icon-sm" />
              {t("indisponibilites.changeButton")}
            </button>
          </div>

          <div className="calendar-manager-layout">
            <div className="detail-card">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <CalendarOff className="icon-sm" />
                {t("indisponibilites.calendarTitle")}
              </h3>
              <AvailabilityCalendar indisponibilites={bien.indisponibilites || []} />
            </div>

            <div>
              <div className="page-header" style={{ marginBottom: "0.75rem" }}>
                <h3 style={{ margin: 0 }}>{t("indisponibilites.periodsTitle")}</h3>
                <button type="button" className="btn btn-primary btn-small" onClick={() => setModal({ mode: "create" })}>
                  <Plus className="icon-sm" />
                  {t("indisponibilites.addPeriod")}
                </button>
              </div>

              {(bien.indisponibilites || []).length === 0 ? (
                <div className="empty-state">
                  <CalendarOff className="icon" />
                  {t("indisponibilites.noPeriods")}
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("indisponibilites.colStart")}</th>
                        <th>{t("indisponibilites.colEnd")}</th>
                        <th>{t("indisponibilites.colReason")}</th>
                        <th className="actions-col">{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bien.indisponibilites.map((row) => (
                        <tr key={row.id}>
                          <td>{row.date_debut}</td>
                          <td>{row.date_fin}</td>
                          <td>{row.motif || "-"}</td>
                          <td className="actions-col">
                            <div className="row-actions">
                              <button
                                className="btn btn-small"
                                type="button"
                                onClick={() => setModal({ mode: "edit", row })}
                              >
                                <Pencil className="icon-sm" />
                                {t("common.edit")}
                              </button>
                              <button
                                className="btn btn-small btn-danger"
                                type="button"
                                onClick={() => handleDelete(row)}
                              >
                                <Trash2 className="icon-sm" />
                                {t("common.delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {modal && (
        <Modal
          title={modal.mode === "create" ? t("indisponibilites.addPeriod") : t("indisponibilites.editPeriod")}
          onClose={() => setModal(null)}
          width="420px"
        >
          <ResourceForm
            fields={periodFields}
            initialValues={modal.mode === "edit" ? modal.row : undefined}
            onSubmit={(values) => (modal.mode === "create" ? handleCreate(values) : handleEdit(modal.row, values))}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
