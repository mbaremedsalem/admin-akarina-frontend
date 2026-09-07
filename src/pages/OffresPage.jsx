import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Check, ImageOff, Megaphone, Percent, Tag, X } from "lucide-react";
import ResourcePage from "../components/ResourcePage";
import { useResource } from "../api/useResource";

export default function OffresPage() {
  const { t } = useTranslation();
  const { items: biens, loading: biensLoading } = useResource("/biens/");

  const TYPE_OPTIONS = [
    { value: "publicite", label: t("offres.typePublicite") },
    { value: "promotion", label: t("offres.typePromotion") },
    { value: "reduction", label: t("offres.typeReduction") },
  ];

  const bienOptions = useMemo(
    () => biens.map((b) => ({ value: String(b.id), label: `${b.reference} - ${b.titre}` })),
    [biens]
  );
  const bienLabelById = useMemo(() => {
    const map = new Map();
    biens.forEach((b) => map.set(b.id, `${b.reference} - ${b.titre}`));
    return map;
  }, [biens]);

  const columns = [
    {
      key: "image",
      label: t("offres.colImage"),
      render: (row) =>
        row.image ? (
          <img
            src={row.image}
            alt=""
            style={{ width: 56, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
          />
        ) : (
          <span className="thumb-placeholder" style={{ width: 56, height: 36 }}>
            <ImageOff className="icon-sm" />
          </span>
        ),
    },
    {
      key: "titre",
      label: t("offres.colTitle"),
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
          <Megaphone className="icon-sm muted" />
          {row.titre}
        </span>
      ),
    },
    {
      key: "type_offre",
      label: t("offres.colType"),
      render: (row) => TYPE_OPTIONS.find((opt) => opt.value === row.type_offre)?.label ?? row.type_offre,
    },
    {
      key: "bien",
      label: t("offres.colTargetBien"),
      render: (row) => (row.bien ? bienLabelById.get(row.bien) ?? row.bien : t("offres.general")),
    },
    { key: "reduction_pourcentage", label: t("offres.colReduction"), render: (row) => row.reduction_pourcentage ?? "-" },
    { key: "date_debut", label: t("offres.colStart") },
    { key: "date_fin", label: t("offres.colEnd") },
    {
      key: "actif",
      label: t("offres.colActive"),
      render: (row) => (
        <span className={"badge " + (row.actif ? "badge-on" : "badge-off")}>
          {row.actif ? <Check className="icon-sm" /> : <X className="icon-sm" />}
          {row.actif ? t("common.yes") : t("common.no")}
        </span>
      ),
    },
  ];

  const fields = [
    { key: "titre", label: t("offres.fieldTitle"), required: true, icon: Tag, placeholder: t("offres.fieldTitlePlaceholder") },
    {
      key: "titre_ar",
      label: t("offres.fieldTitleAr"),
      icon: Tag,
      placeholder: t("offres.fieldTitleArPlaceholder"),
      help: t("offres.fieldArHelp"),
      dir: "rtl",
    },
    { key: "description", label: t("offres.fieldDescription"), type: "textarea" },
    { key: "description_ar", label: t("offres.fieldDescriptionAr"), type: "textarea", help: t("offres.fieldArHelp"), dir: "rtl" },
    {
      key: "image",
      label: t("offres.fieldImage"),
      type: "file",
      required: true,
      help: t("offres.fieldImageHelp"),
    },
    { key: "type_offre", label: t("offres.fieldType"), type: "select", required: true, options: TYPE_OPTIONS },
    {
      key: "bien",
      label: t("offres.fieldTargetBien"),
      type: "select",
      options: bienOptions,
      placeholder: t("offres.fieldTargetBienPlaceholder"),
      help: t("offres.fieldTargetBienHelp"),
      icon: Building2,
    },
    { key: "reduction_pourcentage", label: t("offres.fieldReduction"), type: "number", step: "0.01", icon: Percent },
    { key: "date_debut", label: t("offres.fieldStart"), type: "date", required: true },
    { key: "date_fin", label: t("offres.fieldEnd"), type: "date", required: true },
    { key: "actif", label: t("offres.fieldActive"), type: "checkbox", default: true },
  ];

  function transformSubmit(values) {
    return {
      ...values,
      bien: values.bien ? Number(values.bien) : null,
      reduction_pourcentage: values.reduction_pourcentage === "" ? null : Number(values.reduction_pourcentage),
    };
  }

  if (biensLoading) return <div className="page-loading">{t("common.loading")}</div>;

  return (
    <ResourcePage
      title={t("offres.title")}
      titleIcon={Megaphone}
      endpoint="/offres/"
      columns={columns}
      fields={fields}
      transformSubmit={transformSubmit}
      emptyMessage={t("offres.empty")}
      emptyIcon={Megaphone}
    />
  );
}
