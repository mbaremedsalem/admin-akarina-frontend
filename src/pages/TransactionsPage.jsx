import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Check, CircleSlash, Receipt, User, Wallet, X } from "lucide-react";
import ResourcePage from "../components/ResourcePage";
import { useResource } from "../api/useResource";
import { api } from "../api/client";

export default function TransactionsPage() {
  const { t } = useTranslation();
  const { items: biens, loading: biensLoading } = useResource("/biens/");
  const reloadRef = useRef(null);

  const STATUT_OPTIONS = [
    { value: "en_attente", label: t("transactions.statutEnAttente") },
    { value: "confirmee", label: t("transactions.statutConfirmee") },
    { value: "annulee", label: t("transactions.statutAnnulee") },
    { value: "terminee", label: t("transactions.statutTerminee") },
  ];

  const TYPE_OPTIONS = [
    { value: "vente", label: t("transactions.typeVente") },
    { value: "location", label: t("transactions.typeLocation") },
  ];

  const STATUT_LABEL = Object.fromEntries(STATUT_OPTIONS.map((o) => [o.value, o.label]));

  const bienOptions = useMemo(
    () => biens.map((b) => ({ value: String(b.id), label: `${b.reference} - ${b.titre}` })),
    [biens]
  );

  const columns = [
    {
      key: "reference",
      label: t("transactions.colReference"),
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
          <Receipt className="icon-sm muted" />
          {row.reference}
        </span>
      ),
    },
    { key: "bien_reference", label: t("transactions.colBien") },
    {
      key: "client_nom",
      label: t("transactions.colClient"),
      render: (row) => (
        <span style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <User className="icon-sm muted" />
            {row.client_nom || row.client_username}
          </span>
          {(row.client_telephone || row.client_email) && (
            <span className="muted" style={{ fontSize: "0.8em" }}>
              {row.client_telephone || row.client_email}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "type_transaction",
      label: t("transactions.colType"),
      render: (row) =>
        TYPE_OPTIONS.find((opt) => opt.value === row.type_transaction)?.label ?? row.type_transaction,
    },
    { key: "montant_total", label: t("transactions.colAmount") },
    {
      key: "statut",
      label: t("transactions.colStatus"),
      render: (row) => (
        <span className={"badge statut-" + row.statut}>{STATUT_LABEL[row.statut] ?? row.statut}</span>
      ),
    },
    { key: "date_debut", label: t("transactions.colStart"), render: (row) => row.date_debut || "-" },
    { key: "date_fin", label: t("transactions.colEnd"), render: (row) => row.date_fin || "-" },
  ];

  const fields = [
    { key: "bien", label: t("transactions.fieldBien"), type: "select", required: true, options: bienOptions, icon: Building2 },
    { key: "type_transaction", label: t("transactions.fieldType"), type: "select", required: true, options: TYPE_OPTIONS },
    {
      key: "montant_total",
      label: t("transactions.fieldAmount"),
      type: "number",
      step: "0.01",
      required: true,
      icon: Wallet,
    },
    { key: "date_debut", label: t("transactions.fieldStart"), type: "date" },
    { key: "date_fin", label: t("transactions.fieldEnd"), type: "date" },
    { key: "statut", label: t("transactions.fieldStatus"), type: "select", options: STATUT_OPTIONS, default: "en_attente" },
  ];

  function transformSubmit(values) {
    return {
      ...values,
      bien: values.bien ? Number(values.bien) : null,
      montant_total: values.montant_total === "" ? null : Number(values.montant_total),
      date_debut: values.date_debut || null,
      date_fin: values.date_fin || null,
      statut: values.statut || undefined,
    };
  }

  async function changeStatut(row, statut) {
    try {
      await api.patch(`/transactions/${row.id}/`, { statut });
      reloadRef.current?.();
    } catch (err) {
      window.alert(err.message);
    }
  }

  function rowActions(row) {
    if (row.statut === "en_attente") {
      return (
        <>
          <button className="btn btn-small btn-success" type="button" onClick={() => changeStatut(row, "confirmee")}>
            <Check className="icon-sm" />
            {t("transactions.confirm")}
          </button>
          <button className="btn btn-small btn-danger" type="button" onClick={() => changeStatut(row, "annulee")}>
            <X className="icon-sm" />
            {t("transactions.cancelAction")}
          </button>
        </>
      );
    }
    if (row.statut === "confirmee") {
      return (
        <>
          <button className="btn btn-small btn-success" type="button" onClick={() => changeStatut(row, "terminee")}>
            <Check className="icon-sm" />
            {t("transactions.finish")}
          </button>
          <button className="btn btn-small btn-danger" type="button" onClick={() => changeStatut(row, "annulee")}>
            <CircleSlash className="icon-sm" />
            {t("transactions.cancelAction")}
          </button>
        </>
      );
    }
    return null;
  }

  if (biensLoading) return <div className="page-loading">{t("common.loading")}</div>;

  return (
    <ResourcePage
      title={t("transactions.title")}
      titleIcon={Receipt}
      endpoint="/transactions/"
      columns={columns}
      fields={fields}
      transformSubmit={transformSubmit}
      rowActions={rowActions}
      canDelete
      emptyMessage={t("transactions.empty")}
      emptyIcon={Receipt}
      onReloadRef={reloadRef}
    />
  );
}
