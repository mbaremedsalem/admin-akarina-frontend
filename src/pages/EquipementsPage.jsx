import { useTranslation } from "react-i18next";
import { Sofa, Sparkles, Tag } from "lucide-react";
import ResourcePage from "../components/ResourcePage";

export default function EquipementsPage() {
  const { t } = useTranslation();

  const columns = [
    {
      key: "nom",
      label: t("equipements.colName"),
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
          <Sofa className="icon-sm muted" />
          {row.nom}
        </span>
      ),
    },
    { key: "icone", label: t("equipements.colIcon"), render: (row) => row.icone || "-" },
  ];

  const fields = [
    { key: "nom", label: t("equipements.fieldName"), required: true, icon: Tag, placeholder: t("equipements.fieldNamePlaceholder") },
    {
      key: "nom_ar",
      label: t("equipements.fieldNameAr"),
      icon: Tag,
      placeholder: t("equipements.fieldNameArPlaceholder"),
      help: t("equipements.fieldArHelp"),
      dir: "rtl",
    },
    {
      key: "icone",
      label: t("equipements.fieldIcon"),
      icon: Sparkles,
      help: t("equipements.fieldIconHelp"),
    },
  ];

  return (
    <ResourcePage
      title={t("equipements.title")}
      titleIcon={Sofa}
      endpoint="/equipements/"
      columns={columns}
      fields={fields}
      emptyMessage={t("equipements.empty")}
      emptyIcon={Sofa}
    />
  );
}
