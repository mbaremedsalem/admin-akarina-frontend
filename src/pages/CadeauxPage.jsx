import { useTranslation } from "react-i18next";
import { Boxes, Check, Gift, Star, Tag, Wallet, X } from "lucide-react";
import ResourcePage from "../components/ResourcePage";

export default function CadeauxPage() {
  const { t } = useTranslation();

  const columns = [
    {
      key: "nom",
      label: t("cadeaux.colName"),
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
          <Gift className="icon-sm muted" />
          {row.nom}
        </span>
      ),
    },
    { key: "points_necessaires", label: t("cadeaux.colPoints") },
    { key: "valeur_argent", label: t("cadeaux.colValue"), render: (row) => row.valeur_argent ?? "-" },
    { key: "stock", label: t("cadeaux.colStock") },
    {
      key: "actif",
      label: t("cadeaux.colActive"),
      render: (row) => (
        <span className={"badge " + (row.actif ? "badge-on" : "badge-off")}>
          {row.actif ? <Check className="icon-sm" /> : <X className="icon-sm" />}
          {row.actif ? t("common.yes") : t("common.no")}
        </span>
      ),
    },
  ];

  const fields = [
    { key: "nom", label: t("cadeaux.fieldName"), required: true, icon: Tag, placeholder: t("cadeaux.fieldNamePlaceholder") },
    { key: "description", label: t("cadeaux.fieldDescription"), type: "textarea" },
    { key: "points_necessaires", label: t("cadeaux.fieldPoints"), type: "number", required: true, icon: Star },
    { key: "valeur_argent", label: t("cadeaux.fieldValue"), type: "number", step: "0.01", icon: Wallet },
    { key: "stock", label: t("cadeaux.fieldStock"), type: "number", required: true, icon: Boxes },
    { key: "actif", label: t("cadeaux.fieldActive"), type: "checkbox", default: true },
  ];

  function transformSubmit(values) {
    return {
      ...values,
      points_necessaires: Number(values.points_necessaires),
      valeur_argent: values.valeur_argent === "" ? null : Number(values.valeur_argent),
      stock: Number(values.stock),
    };
  }

  return (
    <ResourcePage
      title={t("cadeaux.title")}
      titleIcon={Gift}
      endpoint="/cadeaux/"
      columns={columns}
      fields={fields}
      transformSubmit={transformSubmit}
      emptyMessage={t("cadeaux.empty")}
      emptyIcon={Gift}
    />
  );
}
