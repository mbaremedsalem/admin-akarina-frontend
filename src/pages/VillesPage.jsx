import { useTranslation } from "react-i18next";
import { Globe2, Map, MapPin, Tag } from "lucide-react";
import ResourcePage from "../components/ResourcePage";

export default function VillesPage() {
  const { t } = useTranslation();

  const columns = [
    {
      key: "nom",
      label: t("villes.colName"),
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
          <MapPin className="icon-sm muted" />
          {row.nom}
        </span>
      ),
    },
    { key: "region", label: t("villes.colRegion"), render: (row) => row.region || "-" },
    { key: "pays", label: t("villes.colCountry"), render: (row) => row.pays || "-" },
    { key: "quartiers", label: t("villes.colQuartiers"), render: (row) => row.quartiers?.length ?? 0 },
  ];

  const fields = [
    { key: "nom", label: t("villes.fieldName"), required: true, icon: Tag, placeholder: t("villes.fieldNamePlaceholder") },
    { key: "nom_ar", label: t("villes.fieldNameAr"), icon: Tag, placeholder: t("villes.fieldNameArPlaceholder"), help: t("villes.fieldArHelp"), dir: "rtl" },
    { key: "region", label: t("villes.fieldRegion"), icon: Map, placeholder: t("villes.fieldRegionPlaceholder") },
    { key: "pays", label: t("villes.fieldCountry"), required: true, default: "Mauritanie", icon: Globe2 },
  ];

  return (
    <ResourcePage
      title={t("villes.title")}
      titleIcon={MapPin}
      endpoint="/villes/"
      columns={columns}
      fields={fields}
      emptyMessage={t("villes.empty")}
      emptyIcon={MapPin}
    />
  );
}
