import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Info, Repeat } from "lucide-react";
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

  const columns = [
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

  if (usersLoading || cadeauxLoading) return <div className="page-loading">{t("common.loading")}</div>;

  return (
    <ResourcePage
      title={t("echanges.title")}
      titleIcon={Repeat}
      endpoint="/echanges-cadeaux/"
      columns={columns}
      fields={[]}
      canCreate={false}
      canEdit={false}
      canDelete={false}
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
