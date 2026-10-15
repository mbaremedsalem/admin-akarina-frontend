import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, Map, Save } from "lucide-react";
import { api } from "../api/client";
import GoogleMapPlanEditor from "../components/GoogleMapPlanEditor";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function PlanEditorPage() {
  const { t } = useTranslation();
  const { planId } = useParams();

  const [plan, setPlan] = useState(null);
  const [quartierVilleId, setQuartierVilleId] = useState(null);
  const [position, setPosition] = useState(null);
  const [lots, setLots] = useState([]);
  const [lotsDetectes, setLotsDetectes] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const loadLots = useCallback((quartierId, planIdValue) => {
    api
      .list("/biens/", { type_bien: "terrain", quartier: quartierId })
      .then((biens) => {
        setLots(
          biens
            .filter((b) => b.detail_terrain?.plan === Number(planIdValue) && b.detail_terrain?.polygone)
            .map((b) => ({
              reference: b.reference,
              titre: b.titre,
              numero_lot: b.detail_terrain.numero_lot,
              polygone: b.detail_terrain.polygone,
            }))
        );
      })
      .catch(() => {});
  }, []);

  const loadLotsDetectes = useCallback((planIdValue) => {
    api
      .list("/lots-detectes/", { plan: planIdValue, statut: "en_attente" })
      .then(setLotsDetectes)
      .catch(() => {});
  }, []);

  const loadZones = useCallback((planIdValue) => {
    api
      .list("/zones-plan/", { plan: planIdValue })
      .then(setZones)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/plans-quartier/${planId}/`)
      .then((data) => {
        if (cancelled) return;
        setPlan(data);
        setPosition({
          centerLat: Number(data.centre_latitude),
          centerLng: Number(data.centre_longitude),
          largeurM: Number(data.largeur_m),
          hauteurM: Number(data.hauteur_m),
          rotationDeg: Number(data.rotation_deg),
        });
        loadLots(data.quartier, data.id);
        loadLotsDetectes(data.id);
        loadZones(data.id);
        api
          .get(`/quartiers/${data.quartier}/`)
          .then((quartier) => !cancelled && setQuartierVilleId(quartier.ville))
          .catch(() => {});
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [planId, loadLots, loadLotsDetectes, loadZones]);

  async function handleSavePosition() {
    setSaving(true);
    setSaveMessage(null);
    try {
      await api.patch(`/plans-quartier/${planId}/`, {
        centre_latitude: position.centerLat,
        centre_longitude: position.centerLng,
        largeur_m: position.largeurM,
        hauteur_m: position.hauteurM,
        rotation_deg: position.rotationDeg,
      });
      setSaveMessage(t("plansQuartier.positionSaved"));
    } catch (err) {
      setSaveMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLotDrawn({ polygone, numeroLot, bienReference, bienData, lotDetecteId }) {
    try {
      let reference = bienReference;
      if (bienData) {
        const centroide = polygone.reduce(
          (acc, p) => ({ lat: acc.lat + p.lat / polygone.length, lng: acc.lng + p.lng / polygone.length }),
          { lat: 0, lng: 0 }
        );
        const bien = await api.post("/biens/", {
          type_bien: "terrain",
          ville: quartierVilleId,
          quartier: plan.quartier,
          // Bien.latitude/longitude sont des DecimalField(max_digits=9,
          // decimal_places=6) : un centroide JS brut a bien plus de 6
          // decimales et fait echouer la validation ("plus de 9 chiffres
          // au total"), d'ou l'arrondi explicite ici.
          latitude: Number(centroide.lat.toFixed(6)),
          longitude: Number(centroide.lng.toFixed(6)),
          ...bienData,
        });
        reference = bien.reference;
      }
      await api.patch(`/biens/${reference}/parcelle/`, {
        plan: plan.id,
        numero_lot: numeroLot,
        polygone,
        lot_detecte_id: lotDetecteId ?? undefined,
      });
      loadLots(plan.quartier, plan.id);
      loadLotsDetectes(plan.id);
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function handleLotClick(lot) {
    if (!window.confirm(t("plansQuartier.confirmDetach", { numero: lot.numero_lot, reference: lot.reference }))) {
      return;
    }
    try {
      await api.patch(`/biens/${lot.reference}/parcelle/`, { plan: null, numero_lot: "", polygone: null });
      loadLots(plan.quartier, plan.id);
      loadLotsDetectes(plan.id);
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function handleLotDetecteIgnored(lotDetecteId) {
    try {
      await api.patch(`/lots-detectes/${lotDetecteId}/`, { statut: "ignore" });
      loadLotsDetectes(plan.id);
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function handleZoneUpdated(zoneId, updates) {
    try {
      await api.patch(`/zones-plan/${zoneId}/`, updates);
      loadZones(plan.id);
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function handleZonePublished(zoneId, fields, polygone, prix) {
    try {
      const centroide = polygone.reduce(
        (acc, p) => ({ lat: acc.lat + p.lat / polygone.length, lng: acc.lng + p.lng / polygone.length }),
        { lat: 0, lng: 0 }
      );
      const bien = await api.post("/biens/", {
        titre: fields.nom,
        type_bien: "espace",
        // Un espace se vend comme un terrain : prix fixe (meme regle que
        // Bien.clean()/BienDetailSerializer.validate()).
        type_transaction: "vente",
        unite_prix: "forfait",
        prix,
        ville: quartierVilleId,
        quartier: plan.quartier,
        // Meme arrondi que pour un terrain : Bien.latitude/longitude
        // n'acceptent que 6 decimales.
        latitude: Number(centroide.lat.toFixed(6)),
        longitude: Number(centroide.lng.toFixed(6)),
        adresse_complete: fields.adresse,
        description: fields.description,
        detail_terrain: {
          superficie_m2: fields.superficie_m2,
          longueur_m: fields.longueur_m,
          largeur_m: fields.largeur_m,
          moughataa: fields.moughataa,
        },
      });
      await api.patch(`/biens/${bien.reference}/parcelle/`, {
        plan: plan.id,
        numero_lot: "",
        polygone,
      });
      await api.patch(`/zones-plan/${zoneId}/`, { ...fields, bien: bien.id });
      loadZones(plan.id);
    } catch (err) {
      window.alert(err.message);
    }
  }

  if (loading) return <div className="page-loading">{t("common.loading")}</div>;

  if (error || !plan || !position) {
    return (
      <div className="resource-page">
        <div className="alert alert-error">
          <AlertCircle className="icon-sm" />
          <span>{error || t("plansQuartier.notFound")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="resource-page">
      <div className="page-header">
        <h1>
          <span className="page-header-icon">
            <Map className="icon" strokeWidth={2} />
          </span>
          {plan.nom || t("plansQuartier.sansNom")}
        </h1>
        <div className="page-header-actions">
          <Link className="btn btn-ghost" to="/plans-quartier">
            <ArrowLeft className="icon-sm" />
            {t("plansQuartier.back")}
          </Link>
          <button type="button" className="btn btn-primary" onClick={handleSavePosition} disabled={saving}>
            <Save className="icon-sm" />
            {saving ? t("common.saving") : t("plansQuartier.savePosition")}
          </button>
        </div>
      </div>

      <p className="muted" style={{ marginBottom: "0.75rem" }}>
        {t("plansQuartier.editorHelp")}
        {lotsDetectes.length > 0 && " " + t("plansQuartier.lotsDetectesCount", { count: lotsDetectes.length })}
      </p>
      {saveMessage && <p className="muted">{saveMessage}</p>}

      <GoogleMapPlanEditor
        apiKey={GOOGLE_MAPS_API_KEY}
        image={plan.image}
        position={position}
        onPositionChange={setPosition}
        editablePosition
        drawingEnabled
        lots={lots}
        lotsDetectes={lotsDetectes}
        zones={zones}
        quartierId={plan.quartier}
        onLotDrawn={handleLotDrawn}
        onLotClick={handleLotClick}
        onLotDetecteIgnored={handleLotDetecteIgnored}
        onZoneUpdated={handleZoneUpdated}
        onZonePublished={handleZonePublished}
        height={620}
      />
    </div>
  );
}
