import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Hash, Info, Repeat } from "lucide-react";
import ResourcePage from "../components/ResourcePage";
import { useResource } from "../api/useResource";

export default function EchangesCadeauxPage() {
  const { t, i18n } = useTranslation();
  const { items: utilisateurs, loading: usersLoading } = useResource("/utilisateurs/");
  const { items: cadeaux, loading: cadeauxLoading } = useResource("/cadeaux/");

  const STATUT_LABEL = {
    en_attente: t("echanges.statutEnAttente"),
    valide: t("echanges.statutValide"),
    refuse: t("echanges.statutRefuse"),
    receptionne: t("echanges.statutReceptionne"),
  };

  const userNameById = useMemo(() => {
    const map = new Map();
    utilisateurs.forEach((u) => map.set(u.id, u.username));
    return map;
  }, [utilisateurs]);
  const cadeauNameById = useMemo(() => {
    const map = new Map();
    cadeaux.forEach((c) => map.set(c.id, c.nom));
    return map;
  }, [cadeaux]);

  const STATUT_OPTIONS = [
    { value: "en_attente", label: t("echanges.statutEnAttente") },
    { value: "valide", label: t("echanges.statutValide") },
    { value: "refuse", label: t("echanges.statutRefuse") },
    { value: "receptionne", label: t("echanges.statutReceptionne") },
  ];

  const columns = [
    {
      key: "reference",
      label: t("echanges.colReference"),
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, fontFamily: "monospace" }}>
          <Hash className="icon-sm muted" />
          {row.reference}
        </span>
      ),
    },
    {
      key: "utilisateur",
      label: t("echanges.colUser"),
      render: (row) => userNameById.get(row.utilisateur) ?? row.utilisateur,
    },
    { key: "cadeau", label: t("echanges.colCadeau"), render: (row) => cadeauNameById.get(row.cadeau) ?? row.cadeau },
    { key: "points_utilises", label: t("echanges.colPointsUsed") },
    {
      key: "statut",
      label: t("echanges.colStatus"),
      render: (row) => <span className={"badge statut-" + row.statut}>{STATUT_LABEL[row.statut] ?? row.statut}</span>,
    },
    {
      key: "date_creation",
      label: t("echanges.colDate"),
      render: (row) => new Date(row.date_creation).toLocaleString(i18n.language),
    },
  ];

  const fields = [{ key: "statut", label: t("echanges.colStatus"), type: "select", required: true, options: STATUT_OPTIONS }];

  function transformSubmit(values) {
    return { statut: values.statut };
  }

  if (usersLoading || cadeauxLoading) return <div className="page-loading">{t("common.loading")}</div>;

  return (
    <ResourcePage
      title={t("echanges.title")}
      titleIcon={Repeat}
      endpoint="/echanges-cadeaux/"
      columns={columns}
      fields={fields}
      transformSubmit={transformSubmit}
      canCreate={false}
      canEdit
      canDelete
      emptyMessage={t("echanges.empty")}
      emptyIcon={Repeat}
      toolbarExtra={
        <p className="muted toolbar-note">
          <Info className="icon-sm" style={{ display: "inline", verticalAlign: "-2px" }} /> {t("echanges.note")}
        </p>
      }
    />
  );
}
