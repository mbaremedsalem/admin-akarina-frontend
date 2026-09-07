import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Building2,
  Check,
  Image as ImageIcon,
  ImageOff,
  Images,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../api/client";
import { useResource } from "../api/useResource";
import Modal from "../components/Modal";
import SearchToggle from "../components/SearchToggle";
import BienForm, { stateFromBien } from "./BienForm";

export default function BiensPage() {
  const { t } = useTranslation();
  const { items: biens, loading, error, reload, setItems } = useResource("/biens/");
  const { items: villes } = useResource("/villes/");
  const { items: quartiers } = useResource("/quartiers/");
  const { items: equipements } = useResource("/equipements/");

  const TYPE_BIEN_LABEL = {
    ceremonie: t("biens.typeCeremonie"),
    duplexe: t("biens.typeDuplexe"),
    appartement: t("biens.typeAppartement"),
    terrain: t("biens.typeTerrain"),
    commercial: t("biens.typeCommercial"),
  };

  const TYPE_TRANSACTION_LABEL = {
    vente: t("bienForm.typeVente"),
    location: t("bienForm.typeLocation"),
  };

  const UNITE_PRIX_LABEL = {
    forfait: t("bienForm.uniteForfait"),
    jour: t("bienForm.uniteJour"),
    "3jours": t("bienForm.unite3Jours"),
    mois: t("bienForm.uniteMois"),
  };

  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', initial?, reference? }
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");

  const filteredBiens = useMemo(() => {
    if (!search.trim()) return biens;
    const q = search.trim().toLowerCase();
    return biens.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [biens, search]);

  async function openEdit(row) {
    setLoadingDetail(true);
    try {
      const detail = await api.get(`/biens/${row.reference}/`);
      setModal({ mode: "edit", reference: row.reference, initial: stateFromBien(detail) });
    } catch (err) {
      window.alert(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSubmit(payload) {
    if (modal.mode === "create") {
      await api.post("/biens/", payload);
    } else {
      await api.patch(`/biens/${modal.reference}/`, payload);
    }
    setModal(null);
    reload();
  }

  async function handleDelete(row) {
    if (!window.confirm(t("biens.confirmDeleteBien", { reference: row.reference }))) return;
    try {
      await api.del(`/biens/${row.reference}/`);
      setItems((prev) => prev.filter((b) => b.reference !== row.reference));
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="resource-page">
      <div className="page-header">
        <h1>
          <span className="page-header-icon">
            <Building2 className="icon" strokeWidth={2} />
          </span>
          {t("biens.title")}
        </h1>
        <div className="page-header-actions">
          {biens.length > 0 && <SearchToggle value={search} onChange={setSearch} />}
          <button className="btn btn-primary" type="button" onClick={() => setModal({ mode: "create" })}>
            <Plus className="icon-sm" />
            {t("common.new")}
          </button>
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
      ) : biens.length === 0 ? (
        <div className="empty-state">
          <Building2 className="icon" />
          {t("biens.empty")}
        </div>
      ) : filteredBiens.length === 0 ? (
        <div className="empty-state">
          <Search className="icon" />
          {t("common.noResults", { search })}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("biens.colPhoto")}</th>
                <th>{t("biens.colReference")}</th>
                <th>{t("biens.colTitle")}</th>
                <th>{t("biens.colType")}</th>
                <th>{t("biens.colTransaction")}</th>
                <th>{t("biens.colPrice")}</th>
                <th>{t("biens.colVille")}</th>
                <th>{t("biens.colActive")}</th>
                <th className="actions-col">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBiens.map((row) => (
                <tr key={row.reference}>
                  <td>
                    {row.photo_principale ? (
                      <img src={row.photo_principale} alt="" className="thumb" />
                    ) : (
                      <span className="thumb-placeholder">
                        <ImageOff className="icon-sm" />
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="muted" style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {row.reference}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{row.titre}</td>
                  <td>{TYPE_BIEN_LABEL[row.type_bien] ?? row.type_bien}</td>
                  <td>{TYPE_TRANSACTION_LABEL[row.type_transaction] ?? row.type_transaction}</td>
                  <td>
                    {row.prix}{" "}
                    <span className="muted">/ {UNITE_PRIX_LABEL[row.unite_prix] ?? row.unite_prix}</span>
                  </td>
                  <td>{row.ville?.nom}</td>
                  <td>
                    <span className={"badge " + (row.actif ? "badge-on" : "badge-off")}>
                      {row.actif ? <Check className="icon-sm" /> : <X className="icon-sm" />}
                      {row.actif ? t("common.yes") : t("common.no")}
                    </span>
                  </td>
                  <td className="actions-col">
                    <div className="row-actions">
                      <Link className="btn btn-small" to={`/biens/${row.id}/medias`}>
                        <Images className="icon-sm" />
                        {t("biens.medias")}
                      </Link>
                      <button className="btn btn-small" type="button" onClick={() => openEdit(row)}>
                        <Pencil className="icon-sm" />
                        {t("common.edit")}
                      </button>
                      <button className="btn btn-small btn-danger" type="button" onClick={() => handleDelete(row)}>
                        <Trash2 className="icon-sm" />
                        {t("common.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loadingDetail && (
        <div className="page-loading">
          <ImageIcon className="icon-sm" />
          {t("biens.loadingBien")}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === "create" ? t("biens.newBien") : t("biens.editBien", { reference: modal.reference })}
          onClose={() => setModal(null)}
          width="720px"
        >
          <BienForm
            initial={modal.initial}
            villes={villes}
            quartiers={quartiers}
            equipements={equipements}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
