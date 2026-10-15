import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Map as MapIcon, MapPin, Tag, Waypoints } from "lucide-react";
import ResourcePage from "../components/ResourcePage";
import { useResource } from "../api/useResource";

export default function PlansQuartierPage() {
  const { t } = useTranslation();
  const { items: quartiers, loading: quartiersLoading } = useResource("/quartiers/");

  const quartierOptions = useMemo(
    () => quartiers.map((q) => ({ value: String(q.id), label: q.nom })),
    [quartiers]
  );
  const quartierNameById = useMemo(() => {
    const map = new Map();
    quartiers.forEach((q) => map.set(q.id, q.nom));
    return map;
  }, [quartiers]);

  const columns = [
    {
      key: "nom",
      label: t("plansQuartier.colNom"),
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
          <MapIcon className="icon-sm muted" />
          {row.nom || t("plansQuartier.sansNom")}
        </span>
      ),
    },
    {
      key: "quartier",
      label: t("plansQuartier.colQuartier"),
      render: (row) => quartierNameById.get(row.quartier) ?? row.quartier,
    },
    {
      key: "actif",
      label: t("plansQuartier.colActif"),
      render: (row) => (row.actif ? t("common.yes") : t("common.no")),
    },
  ];

  const fields = [
    { key: "quartier", label: t("plansQuartier.fieldQuartier"), type: "select", required: true, options: quartierOptions, icon: Waypoints },
    { key: "nom", label: t("plansQuartier.fieldNom"), icon: Tag, placeholder: t("plansQuartier.fieldNomPlaceholder") },
    {
      key: "image",
      label: t("plansQuartier.fieldImage"),
      type: "file",
      required: true,
      accept: "image/*,application/pdf",
      help: t("plansQuartier.fieldImageHelp"),
    },
  ];

  function transformSubmit(values) {
    // Position/echelle/rotation ne sont jamais envoyees a la creation : le
    // backend les determine automatiquement (GeoPDF georeference si le
    // PDF en contient une, sinon heritage du dernier plan du meme
    // quartier - voir PlanQuartierSerializer.validate). Seul un PDF non
    // georeference uploade pour un tout premier quartier (aucune des deux
    // sources disponible) renverra une erreur demandant ces champs : rare
    // en pratique, car les plans exportes via un logiciel SIG (ex: ArcMap
    // "Export Map" georeference) portent deja cette information.
    return { ...values, quartier: values.quartier ? Number(values.quartier) : null };
  }

  if (quartiersLoading) return <div className="page-loading">{t("common.loading")}</div>;

  return (
    <ResourcePage
      title={t("plansQuartier.title")}
      titleIcon={MapIcon}
      endpoint="/plans-quartier/"
      columns={columns}
      fields={fields}
      transformSubmit={transformSubmit}
      emptyMessage={t("plansQuartier.empty")}
      emptyIcon={MapIcon}
      rowActions={(row) => (
        <Link className="btn btn-small btn-primary" to={`/plans-quartier/${row.id}/editer`}>
          <MapPin className="icon-sm" />
          {t("plansQuartier.editMap")}
        </Link>
      )}
    />
  );
}
