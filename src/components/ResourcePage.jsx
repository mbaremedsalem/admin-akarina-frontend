import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Inbox, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { useResource } from "../api/useResource";
import Modal from "./Modal";
import ResourceForm from "./ResourceForm";
import SearchToggle from "./SearchToggle";

/**
 * Page CRUD generique : table + creation/edition via modal + suppression.
 * `endpoint` doit se terminer par un slash, ex: "/villes/".
 */
export default function ResourcePage({
  title,
  titleIcon: TitleIcon,
  endpoint,
  idKey = "id",
  columns,
  fields,
  transformSubmit,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  rowActions,
  toolbarExtra,
  emptyMessage,
  emptyIcon: EmptyIcon = Inbox,
  params,
  onReloadRef,
  searchable = true,
}) {
  const { t } = useTranslation();
  const { items, loading, error, reload, setItems } = useResource(endpoint, params);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");

  if (onReloadRef) onReloadRef.current = reload;

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [items, search]);

  const hasFileField = fields.some((f) => f.type === "file");

  function toFormData(payload) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      // Un fichier non modifie reste une simple URL (string) : on ne le renvoie pas,
      // le backend garde le fichier existant lors d'un PATCH partiel.
      if (fields.find((f) => f.key === key)?.type === "file" && typeof value === "string") return;
      formData.append(key, value instanceof File ? value : String(value));
    });
    return formData;
  }

  async function handleCreate(values) {
    const payload = transformSubmit ? transformSubmit(values, false) : values;
    if (hasFileField) {
      await api.post(endpoint, toFormData(payload), { isFormData: true });
    } else {
      await api.post(endpoint, payload);
    }
    setModal(null);
    reload();
  }

  async function handleEdit(row, values) {
    const payload = transformSubmit ? transformSubmit(values, true) : values;
    if (hasFileField) {
      await api.patch(`${endpoint}${row[idKey]}/`, toFormData(payload), { isFormData: true });
    } else {
      await api.patch(`${endpoint}${row[idKey]}/`, payload);
    }
    setModal(null);
    reload();
  }

  async function handleDelete(row) {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await api.del(`${endpoint}${row[idKey]}/`);
      setItems((prev) => prev.filter((it) => it[idKey] !== row[idKey]));
    } catch (err) {
      window.alert(err.message);
    }
  }

  const hasActionsCol = canEdit || canDelete || Boolean(rowActions);

  return (
    <div className="resource-page">
      <div className="page-header">
        <h1>
          {TitleIcon && (
            <span className="page-header-icon">
              <TitleIcon className="icon" strokeWidth={2} />
            </span>
          )}
          {title}
        </h1>
        <div className="page-header-actions">
          {searchable && items.length > 0 && <SearchToggle value={search} onChange={setSearch} />}
          {toolbarExtra}
          {canCreate && (
            <button className="btn btn-primary" type="button" onClick={() => setModal({ mode: "create" })}>
              <Plus className="icon-sm" />
              {t("common.new")}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle className="icon-sm" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="page-loading">{t("common.loading")}</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <EmptyIcon className="icon" />
          {emptyMessage ?? t("common.empty")}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <Search className="icon" />
          {t("common.noResults", { search })}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                {hasActionsCol && <th className="actions-col">{t("common.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((row) => (
                <tr key={row[idKey]}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? "")}</td>
                  ))}
                  {hasActionsCol && (
                    <td className="actions-col">
                      <div className="row-actions">
                        {rowActions && rowActions(row)}
                        {canEdit && (
                          <button
                            className="btn btn-small"
                            type="button"
                            onClick={() => setModal({ mode: "edit", row })}
                          >
                            <Pencil className="icon-sm" />
                            {t("common.edit")}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-small btn-danger"
                            type="button"
                            onClick={() => handleDelete(row)}
                          >
                            <Trash2 className="icon-sm" />
                            {t("common.delete")}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === "create" ? t("common.newTitle", { title }) : t("common.editTitle", { title })}
          onClose={() => setModal(null)}
        >
          <ResourceForm
            fields={fields}
            initialValues={modal.mode === "edit" ? modal.row : undefined}
            onSubmit={(values) =>
              modal.mode === "create" ? handleCreate(values) : handleEdit(modal.row, values)
            }
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
