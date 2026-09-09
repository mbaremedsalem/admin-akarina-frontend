import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowLeftRight,
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CalendarClock,
  ChevronDown,
  Compass,
  FileText,
  Landmark,
  Layers,
  MapPin,
  PartyPopper,
  Ruler,
  Sofa,
  Tag,
  ToggleLeft,
  Users,
  Waypoints,
  Wallet,
} from "lucide-react";
import LocationPicker from "../components/LocationPicker";

function typeBienOptions(t) {
  return [
    { value: "ceremonie", label: t("biens.typeCeremonie") },
    { value: "duplexe", label: t("biens.typeDuplexe") },
    { value: "appartement", label: t("biens.typeAppartement") },
    { value: "terrain", label: t("biens.typeTerrain") },
    { value: "commercial", label: t("biens.typeCommercial") },
  ];
}

function typeTransactionOptions(t) {
  return [
    { value: "vente", label: t("bienForm.typeVente") },
    { value: "location", label: t("bienForm.typeLocation") },
  ];
}

function unitePrixByTransaction(t) {
  return {
    vente: [{ value: "forfait", label: t("bienForm.uniteForfait") }],
    location: [
      { value: "jour", label: t("bienForm.uniteJour") },
      { value: "3jours", label: t("bienForm.unite3Jours") },
      { value: "mois", label: t("bienForm.uniteMois") },
    ],
  };
}

function emptyState() {
  return {
    titre: "",
    titre_ar: "",
    description: "",
    description_ar: "",
    type_bien: "appartement",
    type_transaction: "location",
    meuble: false,
    nb_chambres: "",
    nb_salles_bain: "",
    nb_etages: "",
    prix: "",
    unite_prix: "mois",
    ville: "",
    quartier: "",
    adresse_complete: "",
    adresse_complete_ar: "",
    latitude: "",
    longitude: "",
    nb_proprietaires: 1,
    equipements_ids: [],
    detail_ceremonie: { avec_service: false, description_service: "", description_service_ar: "", capacite_personnes: "" },
    detail_terrain: { superficie_m2: "", longueur_m: "", largeur_m: "", titre_foncier: "", borne: false },
    actif: true,
    vendu: false,
  };
}

export function stateFromBien(bien) {
  return {
    titre: bien.titre ?? "",
    titre_ar: bien.titre_ar ?? "",
    description: bien.description ?? "",
    description_ar: bien.description_ar ?? "",
    type_bien: bien.type_bien ?? "appartement",
    type_transaction: bien.type_transaction ?? "location",
    meuble: Boolean(bien.meuble),
    nb_chambres: bien.nb_chambres ?? "",
    nb_salles_bain: bien.nb_salles_bain ?? "",
    nb_etages: bien.nb_etages ?? "",
    prix: bien.prix ?? "",
    unite_prix: bien.unite_prix ?? "forfait",
    ville: bien.ville ? String(bien.ville) : "",
    quartier: bien.quartier ? String(bien.quartier) : "",
    adresse_complete: bien.adresse_complete ?? "",
    adresse_complete_ar: bien.adresse_complete_ar ?? "",
    latitude: bien.latitude ?? "",
    longitude: bien.longitude ?? "",
    nb_proprietaires: bien.nb_proprietaires ?? 1,
    equipements_ids: (bien.equipements || []).map((e) => String(e.id)),
    detail_ceremonie: {
      avec_service: Boolean(bien.detail_ceremonie?.avec_service),
      description_service: bien.detail_ceremonie?.description_service ?? "",
      description_service_ar: bien.detail_ceremonie?.description_service_ar ?? "",
      capacite_personnes: bien.detail_ceremonie?.capacite_personnes ?? "",
    },
    detail_terrain: {
      superficie_m2: bien.detail_terrain?.superficie_m2 ?? "",
      longueur_m: bien.detail_terrain?.longueur_m ?? "",
      largeur_m: bien.detail_terrain?.largeur_m ?? "",
      titre_foncier: bien.detail_terrain?.titre_foncier ?? "",
      borne: Boolean(bien.detail_terrain?.borne),
    },
    actif: bien.actif ?? true,
    vendu: Boolean(bien.vendu),
  };
}

export function buildBienPayload(values) {
  const payload = {
    titre: values.titre,
    titre_ar: values.titre_ar,
    description: values.description,
    description_ar: values.description_ar,
    type_bien: values.type_bien,
    type_transaction: values.type_transaction,
    meuble: Boolean(values.meuble),
    nb_chambres: values.nb_chambres === "" ? null : Number(values.nb_chambres),
    nb_salles_bain: values.nb_salles_bain === "" ? null : Number(values.nb_salles_bain),
    nb_etages: values.nb_etages === "" ? null : Number(values.nb_etages),
    prix: values.prix === "" ? null : Number(values.prix),
    unite_prix: values.unite_prix,
    ville: values.ville ? Number(values.ville) : null,
    quartier: values.quartier ? Number(values.quartier) : null,
    adresse_complete: values.adresse_complete,
    adresse_complete_ar: values.adresse_complete_ar,
    latitude: values.latitude === "" ? null : Number(values.latitude),
    longitude: values.longitude === "" ? null : Number(values.longitude),
    nb_proprietaires: values.nb_proprietaires === "" ? 1 : Number(values.nb_proprietaires),
    equipements_ids: (values.equipements_ids || []).map(Number),
    actif: Boolean(values.actif),
    vendu: Boolean(values.vendu),
  };

  if (values.type_bien === "ceremonie") {
    payload.detail_ceremonie = {
      avec_service: Boolean(values.detail_ceremonie.avec_service),
      description_service: values.detail_ceremonie.description_service,
      description_service_ar: values.detail_ceremonie.description_service_ar,
      capacite_personnes:
        values.detail_ceremonie.capacite_personnes === ""
          ? null
          : Number(values.detail_ceremonie.capacite_personnes),
    };
  }
  if (values.type_bien === "terrain") {
    payload.detail_terrain = {
      superficie_m2:
        values.detail_terrain.superficie_m2 === "" ? null : Number(values.detail_terrain.superficie_m2),
      longueur_m: values.detail_terrain.longueur_m === "" ? null : Number(values.detail_terrain.longueur_m),
      largeur_m: values.detail_terrain.largeur_m === "" ? null : Number(values.detail_terrain.largeur_m),
      titre_foncier: values.detail_terrain.titre_foncier,
      borne: Boolean(values.detail_terrain.borne),
    };
  }

  return payload;
}

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="field-icon-wrap">
      <Icon className="icon" />
      <input {...props} />
    </div>
  );
}

function IconSelect({ icon: Icon, children, ...props }) {
  return (
    <div className={"field-select-wrap" + (Icon ? " field-icon-wrap" : "")}>
      {Icon && <Icon className="icon" />}
      <select {...props}>{children}</select>
      <ChevronDown className="icon chevron" />
    </div>
  );
}

export default function BienForm({ initial, villes, quartiers, equipements, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => initial || emptyState());
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const TYPE_BIEN_OPTIONS = useMemo(() => typeBienOptions(t), [t]);
  const TYPE_TRANSACTION_OPTIONS = useMemo(() => typeTransactionOptions(t), [t]);
  const UNITE_PRIX_BY_TRANSACTION = useMemo(() => unitePrixByTransaction(t), [t]);

  const quartierOptions = useMemo(
    () => quartiers.filter((q) => String(q.ville) === String(values.ville)),
    [quartiers, values.ville]
  );
  const uniteOptions = UNITE_PRIX_BY_TRANSACTION[values.type_transaction] || [];

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function setDetail(group, key, value) {
    setValues((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  }

  function onTypeTransactionChange(value) {
    setValues((prev) => ({
      ...prev,
      type_transaction: value,
      unite_prix: value === "vente" ? "forfait" : "mois",
    }));
  }

  function onVilleChange(value) {
    setValues((prev) => ({ ...prev, ville: value, quartier: "" }));
  }

  function toggleEquipement(id) {
    setValues((prev) => {
      const idStr = String(id);
      const has = prev.equipements_ids.includes(idStr);
      return {
        ...prev,
        equipements_ids: has
          ? prev.equipements_ids.filter((e) => e !== idStr)
          : [...prev.equipements_ids, idStr],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(buildBienPayload(values));
    } catch (err) {
      setError(err.message || t("common.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="resource-form bien-form">
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="icon-sm" />
          <span>{error}</span>
        </div>
      )}

      <label className="field">
        <span>{t("bienForm.fieldTitle")} *</span>
        <IconInput
          icon={Tag}
          value={values.titre}
          onChange={(e) => set("titre", e.target.value)}
          required
          placeholder={t("bienForm.fieldTitlePlaceholder")}
        />
      </label>

      <label className="field">
        <span>{t("bienForm.fieldTitleAr")}</span>
        <IconInput
          icon={Tag}
          value={values.titre_ar}
          onChange={(e) => set("titre_ar", e.target.value)}
          placeholder={t("bienForm.fieldTitleArPlaceholder")}
          dir="rtl"
        />
        <small className="field-help">{t("bienForm.fieldArHelp")}</small>
      </label>

      <label className="field">
        <span>{t("bienForm.fieldDescription")}</span>
        <textarea value={values.description} onChange={(e) => set("description", e.target.value)} rows={3} />
      </label>

      <label className="field">
        <span>{t("bienForm.fieldDescriptionAr")}</span>
        <textarea
          value={values.description_ar}
          onChange={(e) => set("description_ar", e.target.value)}
          rows={3}
          dir="rtl"
        />
        <small className="field-help">{t("bienForm.fieldArHelp")}</small>
      </label>

      <div className="field-row">
        <label className="field">
          <span>{t("bienForm.fieldTypeBien")} *</span>
          <IconSelect
            icon={Building2}
            value={values.type_bien}
            onChange={(e) => set("type_bien", e.target.value)}
            required
          >
            {TYPE_BIEN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </IconSelect>
        </label>

        <label className="field">
          <span>{t("bienForm.fieldTypeTransaction")} *</span>
          <IconSelect
            icon={ArrowLeftRight}
            value={values.type_transaction}
            onChange={(e) => onTypeTransactionChange(e.target.value)}
            required
          >
            {TYPE_TRANSACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </IconSelect>
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>{t("bienForm.fieldPrice")} *</span>
          <IconInput
            icon={Wallet}
            type="number"
            step="0.01"
            value={values.prix}
            onChange={(e) => set("prix", e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>{t("bienForm.fieldUnitePrix")} *</span>
          <IconSelect
            icon={CalendarClock}
            value={values.unite_prix}
            onChange={(e) => set("unite_prix", e.target.value)}
            required
          >
            {uniteOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </IconSelect>
        </label>
      </div>

      <label className="field field-inline">
        <input type="checkbox" checked={values.meuble} onChange={(e) => set("meuble", e.target.checked)} />
        <span>
          <Sofa className="icon-sm bien-inline-icon" />
          {t("bienForm.fieldMeuble")}
        </span>
      </label>

      <div className="field-row field-row-3">
        <label className="field">
          <span>{t("bienForm.fieldChambres")}</span>
          <IconInput
            icon={BedDouble}
            type="number"
            value={values.nb_chambres}
            onChange={(e) => set("nb_chambres", e.target.value)}
          />
        </label>
        <label className="field">
          <span>{t("bienForm.fieldSallesBain")}</span>
          <IconInput
            icon={Bath}
            type="number"
            value={values.nb_salles_bain}
            onChange={(e) => set("nb_salles_bain", e.target.value)}
          />
        </label>
        <label className="field">
          <span>{t("bienForm.fieldEtages")}</span>
          <IconInput
            icon={Layers}
            type="number"
            value={values.nb_etages}
            onChange={(e) => set("nb_etages", e.target.value)}
          />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>{t("bienForm.fieldVille")} *</span>
          <IconSelect icon={MapPin} value={values.ville} onChange={(e) => onVilleChange(e.target.value)} required>
            <option value="">{t("common.chooseOption")}</option>
            {villes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nom}
              </option>
            ))}
          </IconSelect>
        </label>

        <label className="field">
          <span>{t("bienForm.fieldQuartier")}</span>
          <IconSelect icon={Waypoints} value={values.quartier} onChange={(e) => set("quartier", e.target.value)}>
            <option value="">{t("bienForm.noneOption")}</option>
            {quartierOptions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.nom}
              </option>
            ))}
          </IconSelect>
        </label>
      </div>

      <label className="field">
        <span>{t("bienForm.fieldAdresse")}</span>
        <IconInput
          icon={MapPin}
          value={values.adresse_complete}
          onChange={(e) => set("adresse_complete", e.target.value)}
        />
      </label>

      <label className="field">
        <span>{t("bienForm.fieldAdresseAr")}</span>
        <IconInput
          icon={MapPin}
          value={values.adresse_complete_ar}
          onChange={(e) => set("adresse_complete_ar", e.target.value)}
          dir="rtl"
        />
        <small className="field-help">{t("bienForm.fieldArHelp")}</small>
      </label>

      <LocationPicker
        latitude={values.latitude}
        longitude={values.longitude}
        onChange={(lat, lng) => setValues((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
      />

      <div className="field-row">
        <label className="field">
          <span>{t("bienForm.fieldLatitude")} *</span>
          <IconInput
            icon={Compass}
            type="number"
            step="0.000001"
            value={values.latitude}
            onChange={(e) => set("latitude", e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>{t("bienForm.fieldLongitude")} *</span>
          <IconInput
            icon={Compass}
            type="number"
            step="0.000001"
            value={values.longitude}
            onChange={(e) => set("longitude", e.target.value)}
            required
          />
        </label>
      </div>

      <label className="field">
        <span>{t("bienForm.fieldNbProprietaires")}</span>
        <IconInput
          icon={Users}
          type="number"
          value={values.nb_proprietaires}
          onChange={(e) => set("nb_proprietaires", e.target.value)}
        />
      </label>

      <div className="field">
        <span>{t("bienForm.fieldEquipements")}</span>
        <div className="checkbox-grid">
          {equipements.map((eq) => (
            <label key={eq.id} className="field-inline checkbox-chip">
              <input
                type="checkbox"
                checked={values.equipements_ids.includes(String(eq.id))}
                onChange={() => toggleEquipement(eq.id)}
              />
              <span>{eq.nom}</span>
            </label>
          ))}
        </div>
      </div>

      {values.type_bien === "ceremonie" && (
        <fieldset className="fieldset">
          <legend>
            <PartyPopper className="icon-sm" />
            {t("bienForm.ceremonieLegend")}
          </legend>
          <label className="field field-inline">
            <input
              type="checkbox"
              checked={values.detail_ceremonie.avec_service}
              onChange={(e) => setDetail("detail_ceremonie", "avec_service", e.target.checked)}
            />
            <span>{t("bienForm.avecService")}</span>
          </label>
          <label className="field">
            <span>{t("bienForm.descriptionService")}</span>
            <textarea
              rows={2}
              value={values.detail_ceremonie.description_service}
              onChange={(e) => setDetail("detail_ceremonie", "description_service", e.target.value)}
            />
          </label>
          <label className="field">
            <span>{t("bienForm.descriptionServiceAr")}</span>
            <textarea
              rows={2}
              value={values.detail_ceremonie.description_service_ar}
              onChange={(e) => setDetail("detail_ceremonie", "description_service_ar", e.target.value)}
              dir="rtl"
            />
            <small className="field-help">{t("bienForm.fieldArHelp")}</small>
          </label>
          <label className="field">
            <span>{t("bienForm.capacitePersonnes")}</span>
            <IconInput
              icon={Users}
              type="number"
              value={values.detail_ceremonie.capacite_personnes}
              onChange={(e) => setDetail("detail_ceremonie", "capacite_personnes", e.target.value)}
            />
          </label>
        </fieldset>
      )}

      {values.type_bien === "terrain" && (
        <fieldset className="fieldset">
          <legend>
            <Landmark className="icon-sm" />
            {t("bienForm.terrainLegend")}
          </legend>
          <label className="field">
            <span>{t("bienForm.superficie")} *</span>
            <IconInput
              icon={Ruler}
              type="number"
              step="0.01"
              value={values.detail_terrain.superficie_m2}
              onChange={(e) => setDetail("detail_terrain", "superficie_m2", e.target.value)}
              required
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>{t("bienForm.longueur")}</span>
              <IconInput
                icon={Ruler}
                type="number"
                step="0.01"
                value={values.detail_terrain.longueur_m}
                onChange={(e) => setDetail("detail_terrain", "longueur_m", e.target.value)}
              />
            </label>
            <label className="field">
              <span>{t("bienForm.largeur")}</span>
              <IconInput
                icon={Ruler}
                type="number"
                step="0.01"
                value={values.detail_terrain.largeur_m}
                onChange={(e) => setDetail("detail_terrain", "largeur_m", e.target.value)}
              />
            </label>
          </div>
          <label className="field">
            <span>{t("bienForm.titreFoncier")}</span>
            <IconInput
              icon={FileText}
              value={values.detail_terrain.titre_foncier}
              onChange={(e) => setDetail("detail_terrain", "titre_foncier", e.target.value)}
            />
          </label>
          <label className="field field-inline">
            <input
              type="checkbox"
              checked={values.detail_terrain.borne}
              onChange={(e) => setDetail("detail_terrain", "borne", e.target.checked)}
            />
            <span>{t("bienForm.borne")}</span>
          </label>
        </fieldset>
      )}

      <label className="field field-inline">
        <input type="checkbox" checked={values.actif} onChange={(e) => set("actif", e.target.checked)} />
        <span>
          <ToggleLeft className="icon-sm bien-inline-icon" />
          {t("bienForm.fieldActif")}
        </span>
      </label>

      <label className="field field-inline">
        <input type="checkbox" checked={values.vendu} onChange={(e) => set("vendu", e.target.checked)} />
        <span>
          <BadgeCheck className="icon-sm bien-inline-icon" />
          {t("bienForm.fieldVendu")}
        </span>
      </label>
      <small className="field-help" style={{ marginTop: "-0.6rem", marginBottom: "0.9rem", display: "block" }}>
        {t("bienForm.fieldVenduHelp")}
      </small>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </form>
  );
}
