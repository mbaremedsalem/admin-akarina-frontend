import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Tag, Waypoints } from "lucide-react";
import ResourcePage from "../components/ResourcePage";
import { useResource } from "../api/useResource";

export default function QuartiersPage() {
  const { t } = useTranslation();
  const { items: villes, loading: villesLoading } = useResource("/villes/");

  const villeOptions = useMemo(
    () => villes.map((v) => ({ value: String(v.id), label: v.nom })),
    [villes]
  );
  const villeNameById = useMemo(() => {
    const map = new Map();
    villes.forEach((v) => map.set(v.id, v.nom));
    return map;
  }, [villes]);

  const columns = [
    {
      key: "nom",
      label: t("quartiers.colName"),
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
          <Waypoints className="icon-sm muted" />
          {row.nom}
        </span>
      ),
    },
    { key: "ville", label: t("quartiers.colVille"), render: (row) => villeNameById.get(row.ville) ?? row.ville },
  ];

  const fields = [
    {
      key: "nom",
      label: t("quartiers.fieldName"),
      required: true,
      icon: Tag,
      placeholder: t("quartiers.fieldNamePlaceholder"),
    },
    {
      key: "nom_ar",
      label: t("quartiers.fieldNameAr"),
      icon: Tag,
      placeholder: t("quartiers.fieldNameArPlaceholder"),
      help: t("quartiers.fieldArHelp"),
      dir: "rtl",
    },
    { key: "ville", label: t("quartiers.fieldVille"), type: "select", required: true, options: villeOptions, icon: MapPin },
  ];

  function transformSubmit(values) {
    return { ...values, ville: values.ville ? Number(values.ville) : null };
  }

  if (villesLoading) return <div className="page-loading">{t("common.loading")}</div>;

  return (
    <ResourcePage
      title={t("quartiers.title")}
      titleIcon={Waypoints}
      endpoint="/quartiers/"
      columns={columns}
      fields={fields}
      transformSubmit={transformSubmit}
      emptyMessage={t("quartiers.empty")}
      emptyIcon={Waypoints}
    />
  );
}
