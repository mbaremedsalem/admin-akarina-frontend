import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleMap, Marker, OverlayView, Polygon, Polyline, useLoadScript } from "@react-google-maps/api";
import { api } from "../api/client";

const DEFAULT_CENTER = { lat: 18.0858, lng: -15.9785 };

function metersPerPixel(lat, zoom) {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

function metersToLatOffset(m) {
  return m / 111320;
}

function metersToLngOffset(m, atLat) {
  return m / (111320 * Math.cos((atLat * Math.PI) / 180));
}

/**
 * Convertit un point local fractionnaire (fx, fy dans [0,1], (0,0)=coin
 * haut-gauche de l'image du plan, (0.5,0.5)=centre) en lat/lng absolue,
 * compte tenu de la position courante (centre/echelle/rotation) de
 * l'overlay. Derive des memes conventions de signe que handleMoveStart/
 * handleResizeStart ci-dessous (axe x vers l'est, axe y vers le sud,
 * rotation horaire) plutot que d'une formule geo reecrite a part, pour ne
 * pas introduire une inversion silencieuse.
 */
function localPointToLatLng(fx, fy, position) {
  const { centerLat, centerLng, largeurM, hauteurM, rotationDeg } = position;
  const dxLocal = (fx - 0.5) * largeurM;
  const dyLocal = (fy - 0.5) * hauteurM;
  const rad = (rotationDeg * Math.PI) / 180;
  const dxScreen = dxLocal * Math.cos(rad) - dyLocal * Math.sin(rad);
  const dyScreen = dxLocal * Math.sin(rad) + dyLocal * Math.cos(rad);
  return {
    lat: centerLat - metersToLatOffset(dyScreen),
    lng: centerLng + metersToLngOffset(dxScreen, centerLat),
  };
}

function polygonCentroid(points) {
  const n = points.length;
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / n;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / n;
  return { lat, lng };
}

// Zones non-vendables (espace vert, equipement public, mosquee...) : rendu
// purement visuel/informatif, jamais cliquable, pour que le plan affiche
// corresponde fidelement au document source.
const COULEURS_ZONES = {
  espace_vert: { fill: "#86efac", stroke: "#15803d" },
  espace_public: { fill: "#fde68a", stroke: "#b45309" },
  equipement_public: { fill: "#93c5fd", stroke: "#1d4ed8" },
  mosquee: { fill: "#c4b5fd", stroke: "#6d28d9" },
  autre: { fill: "#d1d5db", stroke: "#4b5563" },
};

function PlanImageOverlay({ map, image, position, editable, zoom, onPositionChange }) {
  const dragRef = useRef(null);
  const { centerLat, centerLng, largeurM, hauteurM, rotationDeg } = position;
  const center = { lat: centerLat, lng: centerLng };
  const mpp = metersPerPixel(centerLat, zoom);
  const pxWidth = Math.max(10, largeurM / mpp);
  const pxHeight = Math.max(10, hauteurM / mpp);

  const setMapDraggable = useCallback(
    (value) => {
      if (map) map.setOptions({ draggable: value });
    },
    [map]
  );

  function handleMoveStart(e) {
    if (!editable) return;
    e.stopPropagation();
    setMapDraggable(false);
    dragRef.current = {
      mode: "move",
      startX: e.clientX,
      startY: e.clientY,
      startCenter: center,
      mpp,
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleResizeStart(e) {
    if (!editable) return;
    e.stopPropagation();
    setMapDraggable(false);
    dragRef.current = {
      mode: "resize",
      startX: e.clientX,
      startY: e.clientY,
      startLargeur: largeurM,
      startHauteur: hauteurM,
      rotationDeg,
      mpp,
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleRotateStart(e) {
    if (!editable) return;
    e.stopPropagation();
    setMapDraggable(false);
    const rect = e.currentTarget.closest(".plan-overlay-box").getBoundingClientRect();
    const centerScreen = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    dragRef.current = {
      mode: "rotate",
      centerScreen,
      startAngle: Math.atan2(e.clientY - centerScreen.y, e.clientX - centerScreen.x),
      startRotation: rotationDeg,
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e) {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.mode === "move") {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const newLat = drag.startCenter.lat - metersToLatOffset(dy * drag.mpp);
      const newLng = drag.startCenter.lng + metersToLngOffset(dx * drag.mpp, drag.startCenter.lat);
      onPositionChange({ ...position, centerLat: newLat, centerLng: newLng });
    } else if (drag.mode === "resize") {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const rad = (-drag.rotationDeg * Math.PI) / 180;
      const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);
      const newLargeur = Math.max(5, drag.startLargeur + localDx * drag.mpp * 2);
      const newHauteur = Math.max(5, drag.startHauteur + localDy * drag.mpp * 2);
      onPositionChange({ ...position, largeurM: newLargeur, hauteurM: newHauteur });
    } else if (drag.mode === "rotate") {
      const angle = Math.atan2(e.clientY - drag.centerScreen.y, e.clientX - drag.centerScreen.x);
      const deltaDeg = ((angle - drag.startAngle) * 180) / Math.PI;
      let newRotation = (drag.startRotation + deltaDeg) % 360;
      if (newRotation < 0) newRotation += 360;
      onPositionChange({ ...position, rotationDeg: newRotation });
    }
  }

  function handleMouseUp() {
    dragRef.current = null;
    setMapDraggable(true);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  return (
    <OverlayView position={center} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <div
        className="plan-overlay-box"
        style={{
          position: "absolute",
          transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
          width: pxWidth,
          height: pxHeight,
        }}
      >
        <img
          src={image}
          alt=""
          draggable={false}
          onMouseDown={handleMoveStart}
          style={{
            width: "100%",
            height: "100%",
            opacity: 0.85,
            cursor: editable ? "move" : "default",
            border: editable ? "2px dashed #2563eb" : "1px solid rgba(0,0,0,0.2)",
            boxSizing: "border-box",
          }}
        />
        {editable && (
          <>
            <div
              onMouseDown={handleResizeStart}
              title="Redimensionner"
              style={{
                position: "absolute",
                right: -9,
                bottom: -9,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#2563eb",
                border: "2px solid #fff",
                cursor: "nwse-resize",
              }}
            />
            <div
              onMouseDown={handleRotateStart}
              title="Pivoter"
              style={{
                position: "absolute",
                top: -32,
                left: "50%",
                transform: "translateX(-50%)",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#f97316",
                border: "2px solid #fff",
                cursor: "grab",
              }}
            />
          </>
        )}
      </div>
    </OverlayView>
  );
}

export default function GoogleMapPlanEditor({
  apiKey,
  image,
  position,
  onPositionChange,
  editablePosition = true,
  lots = [],
  lotsDetectes = [],
  zones = [],
  highlightedReference = null,
  drawingEnabled = false,
  onLotDrawn,
  onLotClick,
  onLotDetecteIgnored,
  onZoneUpdated,
  onZonePublished,
  quartierId = null,
  height = 560,
}) {
  const { t } = useTranslation();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: apiKey });
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(16);
  const [pendingPolygon, setPendingPolygon] = useState(null);
  const [drawingPoints, setDrawingPoints] = useState(null);
  const [selectedLotDetecte, setSelectedLotDetecte] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  const center = useMemo(
    () => ({ lat: position.centerLat ?? DEFAULT_CENTER.lat, lng: position.centerLng ?? DEFAULT_CENTER.lng }),
    [position.centerLat, position.centerLng]
  );

  const handleLoad = useCallback((instance) => {
    setMap(instance);
    setZoom(instance.getZoom());
  }, []);

  const handleZoomChanged = useCallback(() => {
    if (map) setZoom(map.getZoom());
  }, [map]);

  function handleMapClick(e) {
    if (drawingPoints === null) return;
    setDrawingPoints((prev) => [...prev, { lat: e.latLng.lat(), lng: e.latLng.lng() }]);
  }

  function startDrawing() {
    setDrawingPoints([]);
  }

  function undoLastPoint() {
    setDrawingPoints((prev) => (prev && prev.length > 0 ? prev.slice(0, -1) : prev));
  }

  function cancelDrawing() {
    setDrawingPoints(null);
  }

  function finishDrawing() {
    if (!drawingPoints || drawingPoints.length < 3) return;
    setPendingPolygon(drawingPoints);
    setDrawingPoints(null);
  }

  function confirmPendingPolygon(payload) {
    if (!pendingPolygon) return;
    onLotDrawn?.({ ...payload, polygone: pendingPolygon, lotDetecteId: selectedLotDetecte?.id ?? null });
    setPendingPolygon(null);
    setSelectedLotDetecte(null);
  }

  function cancelPendingPolygon() {
    setPendingPolygon(null);
    setSelectedLotDetecte(null);
  }

  function handleLotDetecteClick(lotDetecte) {
    if (drawingPoints !== null) return;
    const polygone = lotDetecte.polygone_local.map((p) => localPointToLatLng(p.x, p.y, position));
    setPendingPolygon(polygone);
    setSelectedLotDetecte(lotDetecte);
  }

  function ignoreSelectedLotDetecte() {
    if (!selectedLotDetecte) return;
    onLotDetecteIgnored?.(selectedLotDetecte.id);
    setPendingPolygon(null);
    setSelectedLotDetecte(null);
  }

  if (!apiKey) {
    return <div className="empty-state">{t("plansQuartier.missingApiKey")}</div>;
  }
  if (!isLoaded) {
    return <div className="page-loading">{t("common.loading")}</div>;
  }

  return (
    <div style={{ position: "relative" }}>
      <GoogleMap
        onLoad={handleLoad}
        onZoomChanged={handleZoomChanged}
        onClick={handleMapClick}
        center={center}
        zoom={zoom}
        mapTypeId="satellite"
        mapContainerStyle={{ width: "100%", height }}
        options={{ streetViewControl: false, fullscreenControl: false }}
      >
        {image && (
          <PlanImageOverlay
            map={map}
            image={image}
            position={position}
            editable={editablePosition}
            zoom={zoom}
            onPositionChange={onPositionChange}
          />
        )}

        {zones.map((zone) => {
          const couleur = COULEURS_ZONES[zone.type_zone] || COULEURS_ZONES.autre;
          return (
            <Polygon
              key={`zone-${zone.id}`}
              paths={zone.polygone_local.map((p) => localPointToLatLng(p.x, p.y, position))}
              onClick={() => setSelectedZone(zone)}
              options={{
                fillColor: couleur.fill,
                fillOpacity: 0.45,
                strokeColor: couleur.stroke,
                strokeWeight: 1.5,
                clickable: drawingPoints === null,
                zIndex: 1,
              }}
            />
          );
        })}
        {zones.map((zone) => (
          <Marker
            key={`zone-label-${zone.id}`}
            position={polygonCentroid(zone.polygone_local.map((p) => localPointToLatLng(p.x, p.y, position)))}
            label={{ text: zone.nom, fontSize: "10px", fontWeight: "600", color: "#1f2937" }}
            icon={{
              url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E",
            }}
            onClick={() => setSelectedZone(zone)}
          />
        ))}

        {lots
          .filter((lot) => Array.isArray(lot.polygone) && lot.polygone.length >= 3)
          .map((lot) => (
            <Polygon
              key={lot.reference}
              paths={lot.polygone}
              onClick={() => onLotClick?.(lot)}
              options={{
                fillColor: lot.reference === highlightedReference ? "#f97316" : "#22c55e",
                fillOpacity: 0.35,
                strokeColor: lot.reference === highlightedReference ? "#f97316" : "#16a34a",
                strokeWeight: 2,
                clickable: true,
                zIndex: 2,
              }}
            />
          ))}

        {lots
          .filter((lot) => Array.isArray(lot.polygone) && lot.polygone.length >= 3)
          .map((lot) => (
            <Marker
              key={`label-${lot.reference}`}
              position={polygonCentroid(lot.polygone)}
              label={{ text: lot.numero_lot || "", fontSize: "11px", fontWeight: "700" }}
              icon={{
                url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E",
              }}
              onClick={() => onLotClick?.(lot)}
            />
          ))}

        {lotsDetectes
          .filter((lot) => lot.id !== selectedLotDetecte?.id)
          .map((lot) => {
            const polygone = lot.polygone_local.map((p) => localPointToLatLng(p.x, p.y, position));
            return (
              <Polygon
                key={`detecte-${lot.id}`}
                paths={polygone}
                onClick={() => handleLotDetecteClick(lot)}
                options={{
                  fillColor: "#a855f7",
                  fillOpacity: 0.25,
                  strokeColor: "#a855f7",
                  strokeWeight: 1.5,
                  clickable: drawingPoints === null,
                }}
              />
            );
          })}
        {lotsDetectes
          .filter((lot) => lot.id !== selectedLotDetecte?.id)
          .map((lot) => (
            <Marker
              key={`detecte-label-${lot.id}`}
              position={polygonCentroid(lot.polygone_local.map((p) => localPointToLatLng(p.x, p.y, position)))}
              label={{ text: lot.numero_lot || "", fontSize: "10px", fontWeight: "700", color: "#581c87" }}
              icon={{
                url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E",
              }}
              onClick={() => handleLotDetecteClick(lot)}
            />
          ))}

        {pendingPolygon && (
          <Polygon
            paths={pendingPolygon}
            options={{ fillColor: "#eab308", fillOpacity: 0.4, strokeColor: "#eab308", strokeWeight: 2 }}
          />
        )}

        {drawingPoints && drawingPoints.length >= 3 && (
          <Polygon
            paths={drawingPoints}
            options={{ fillColor: "#eab308", fillOpacity: 0.3, strokeColor: "#eab308", strokeWeight: 2, clickable: false }}
          />
        )}
        {drawingPoints && drawingPoints.length > 0 && drawingPoints.length < 3 && (
          <Polyline paths={drawingPoints} options={{ strokeColor: "#eab308", strokeWeight: 2 }} />
        )}
        {drawingPoints &&
          drawingPoints.map((p, i) => (
            <Marker
              key={`draw-point-${i}`}
              position={p}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: "#eab308",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 1,
              }}
            />
          ))}
      </GoogleMap>

      {drawingEnabled && drawingPoints === null && !pendingPolygon && (
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={startDrawing}
          style={{ position: "absolute", top: 12, left: 12, zIndex: 5 }}
        >
          {t("plansQuartier.startDrawing")}
        </button>
      )}

      {drawingPoints !== null && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "#fff",
            borderRadius: 8,
            padding: "0.6rem 0.8rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.drawingPoints", { count: drawingPoints.length })}</span>
          <button type="button" className="btn btn-ghost btn-small" onClick={undoLastPoint} disabled={drawingPoints.length === 0}>
            {t("plansQuartier.undoPoint")}
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={cancelDrawing}>
            {t("common.cancel")}
          </button>
          <button type="button" className="btn btn-primary btn-small" onClick={finishDrawing} disabled={drawingPoints.length < 3}>
            {t("plansQuartier.finishDrawing")}
          </button>
        </div>
      )}

      {pendingPolygon && (
        <PendingLotForm
          onConfirm={confirmPendingPolygon}
          onCancel={cancelPendingPolygon}
          onIgnore={selectedLotDetecte ? ignoreSelectedLotDetecte : null}
          quartierId={quartierId}
          initialNumeroLot={selectedLotDetecte?.numero_lot ?? ""}
        />
      )}

      {selectedZone && (
        <ZoneInfoForm
          zone={selectedZone}
          onSave={(updates) => {
            onZoneUpdated?.(selectedZone.id, updates);
            setSelectedZone(null);
          }}
          onPublish={(updates, prix) => {
            const polygone = selectedZone.polygone_local.map((p) => localPointToLatLng(p.x, p.y, position));
            onZonePublished?.(selectedZone.id, updates, polygone, prix);
            setSelectedZone(null);
          }}
          onCancel={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
}

function ZoneInfoForm({ zone, onSave, onPublish, onCancel }) {
  const { t } = useTranslation();
  const [nom, setNom] = useState(zone.nom);
  const [description, setDescription] = useState(zone.description || "");
  const [moughataa, setMoughataa] = useState(zone.moughataa || "");
  const [adresse, setAdresse] = useState(zone.adresse || "");
  const [superficieM2, setSuperficieM2] = useState(zone.superficie_m2 ?? "");
  const [longueurM, setLongueurM] = useState(zone.longueur_m ?? "");
  const [largeurM, setLargeurM] = useState(zone.largeur_m ?? "");
  const [prix, setPrix] = useState("");

  function champsActuels() {
    return {
      nom: nom.trim(),
      description,
      moughataa: moughataa.trim(),
      adresse: adresse.trim(),
      superficie_m2: superficieM2 === "" ? null : superficieM2,
      longueur_m: longueurM === "" ? null : longueurM,
      largeur_m: largeurM === "" ? null : largeurM,
    };
  }

  function handleSave() {
    if (!nom.trim()) return;
    onSave(champsActuels());
  }

  const peutPublier = nom.trim() && superficieM2 !== "" && prix !== "";

  function handlePublish() {
    if (!peutPublier) return;
    onPublish(champsActuels(), prix);
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        right: 12,
        background: "#fff",
        borderRadius: 8,
        padding: "0.9rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        width: 280,
        maxHeight: "calc(100% - 24px)",
        overflowY: "auto",
        zIndex: 5,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{t("plansQuartier.zoneInfoTitle")}</div>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldZoneNom")}</span>
        <input value={nom} onChange={(e) => setNom(e.target.value)} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldMoughataa")}</span>
        <input value={moughataa} onChange={(e) => setMoughataa(e.target.value)} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldAdresse")}</span>
        <input value={adresse} onChange={(e) => setAdresse(e.target.value)} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldZoneSuperficie")}</span>
        <input
          type="number"
          min="0"
          value={superficieM2}
          onChange={(e) => setSuperficieM2(e.target.value)}
        />
      </label>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldZoneLongueur")}</span>
          <input type="number" min="0" value={longueurM} onChange={(e) => setLongueurM(e.target.value)} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldZoneLargeur")}</span>
          <input type="number" min="0" value={largeurM} onChange={(e) => setLargeurM(e.target.value)} />
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldZoneDescription")}</span>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
      </label>
      {zone.bien ? (
        <p className="muted" style={{ fontSize: "0.78rem", marginBottom: "0.5rem" }}>
          {t("plansQuartier.zoneAlreadyPublished", { id: zone.bien })}
        </p>
      ) : (
        <>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldZonePrix")}</span>
            <input type="number" min="0" value={prix} onChange={(e) => setPrix(e.target.value)} />
          </label>
          <p className="muted" style={{ fontSize: "0.72rem", marginBottom: "0.5rem" }}>
            {t("plansQuartier.zonePublishHelp")}
          </p>
        </>
      )}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-ghost btn-small" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button type="button" className="btn btn-primary btn-small" disabled={!nom.trim()} onClick={handleSave}>
          {t("common.save")}
        </button>
        {!zone.bien && (
          <button type="button" className="btn btn-primary btn-small" disabled={!peutPublier} onClick={handlePublish}>
            {t("plansQuartier.publishZone")}
          </button>
        )}
      </div>
    </div>
  );
}

function PendingLotForm({ onConfirm, onCancel, onIgnore, quartierId, initialNumeroLot = "" }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("existing"); // "existing" | "new"
  const [numeroLot, setNumeroLot] = useState(initialNumeroLot);
  const [query, setQuery] = useState("");
  const [bienReference, setBienReference] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [nouveauBien, setNouveauBien] = useState({
    titre: "",
    prix: "",
    typeTransaction: "vente",
    unitePrix: "forfait",
    adresse: "",
    superficieM2: "",
    longueurM: "",
    largeurM: "",
    moughataa: "",
    titreFoncier: "",
    borne: false,
  });

  useEffect(() => {
    const search = query.trim();
    if (!search) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .list("/biens/", { type_bien: "terrain", quartier: quartierId || undefined, search })
        .then((results) => {
          if (!cancelled) setSuggestions(results.slice(0, 8));
        })
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, quartierId]);

  function pickSuggestion(bien) {
    setBienReference(bien.reference);
    setQuery(`${bien.reference} - ${bien.titre}`);
    setSuggestions([]);
  }

  function setNouveauBienField(champ, valeur) {
    setNouveauBien((prev) => ({ ...prev, [champ]: valeur }));
  }

  // Champs obligatoires pour creer/rattacher un terrain depuis le plan :
  // moughataa, adresse (emplacement), surface, longueur, largeur, numero
  // (numero deja impose plus haut). Titre/prix restent modifiables mais
  // optionnels ici - voir handleConfirm pour leur valeur par defaut.
  const nouveauBienValide =
    nouveauBien.moughataa.trim() &&
    nouveauBien.adresse.trim() &&
    nouveauBien.superficieM2 &&
    nouveauBien.longueurM &&
    nouveauBien.largeurM;

  function handleConfirm() {
    const numero = numeroLot.trim();
    if (!numero) return;
    if (mode === "existing") {
      if (!bienReference) return;
      onConfirm({ numeroLot: numero, bienReference: bienReference.trim() });
    } else {
      if (!nouveauBienValide) return;
      const titre = nouveauBien.titre.trim();
      const prix = nouveauBien.prix;
      const bienData = {
        titre: titre || t("plansQuartier.titrePlaceholder", { numero }),
        type_transaction: "vente",
        unite_prix: "forfait",
        // Titre/prix pas encore renseignes : on cree quand meme le bien,
        // actif des la creation (a completer plus tard depuis la page
        // Biens si besoin) - le prix=0 ne s'affiche plus cote client.
        prix: prix || 0,
        adresse_complete: nouveauBien.adresse.trim(),
        detail_terrain: {
          superficie_m2: nouveauBien.superficieM2,
          longueur_m: nouveauBien.longueurM,
          largeur_m: nouveauBien.largeurM,
          moughataa: nouveauBien.moughataa.trim(),
          titre_foncier: nouveauBien.titreFoncier,
          borne: nouveauBien.borne,
        },
      };
      onConfirm({ numeroLot: numero, bienData });
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        background: "#fff",
        borderRadius: 8,
        padding: "0.9rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        width: 280,
        maxHeight: "calc(100% - 24px)",
        overflowY: "auto",
        zIndex: 5,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{t("plansQuartier.newLot")}</div>

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.75rem" }}>
        <button
          type="button"
          className={mode === "existing" ? "btn btn-primary btn-small" : "btn btn-ghost btn-small"}
          onClick={() => setMode("existing")}
          style={{ flex: 1 }}
        >
          {t("plansQuartier.modeExisting")}
        </button>
        <button
          type="button"
          className={mode === "new" ? "btn btn-primary btn-small" : "btn btn-ghost btn-small"}
          onClick={() => setMode("new")}
          style={{ flex: 1 }}
        >
          {t("plansQuartier.modeNew")}
        </button>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldNumeroLot")} *</span>
        <input value={numeroLot} onChange={(e) => setNumeroLot(e.target.value)} placeholder="245" />
      </label>

      {mode === "existing" ? (
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.75rem", position: "relative" }}>
          <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldBienReference")}</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setBienReference("");
            }}
            placeholder={t("plansQuartier.searchBienPlaceholder")}
          />
          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                zIndex: 6,
                maxHeight: 160,
                overflowY: "auto",
              }}
            >
              {suggestions.map((bien) => (
                <button
                  key={bien.reference}
                  type="button"
                  onClick={() => pickSuggestion(bien)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.4rem 0.6rem",
                    border: "none",
                    background: "transparent",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  <strong>{bien.reference}</strong> — {bien.titre}
                </button>
              ))}
            </div>
          )}
        </label>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldMoughataa")} *</span>
            <input value={nouveauBien.moughataa} onChange={(e) => setNouveauBienField("moughataa", e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldAdresse")} *</span>
            <input value={nouveauBien.adresse} onChange={(e) => setNouveauBienField("adresse", e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldSuperficie")} *</span>
            <input type="number" min="0" value={nouveauBien.superficieM2} onChange={(e) => setNouveauBienField("superficieM2", e.target.value)} />
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
              <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldLongueur")} *</span>
              <input type="number" min="0" value={nouveauBien.longueurM} onChange={(e) => setNouveauBienField("longueurM", e.target.value)} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
              <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldLargeur")} *</span>
              <input type="number" min="0" value={nouveauBien.largeurM} onChange={(e) => setNouveauBienField("largeurM", e.target.value)} />
            </label>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0.25rem 0" }} />
          <p className="muted" style={{ fontSize: "0.75rem", margin: 0 }}>
            {t("plansQuartier.optionalFieldsHelp")}
          </p>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldTitre")}</span>
            <input value={nouveauBien.titre} onChange={(e) => setNouveauBienField("titre", e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldPrix")}</span>
            <input type="number" min="0" value={nouveauBien.prix} onChange={(e) => setNouveauBienField("prix", e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem" }}>{t("plansQuartier.fieldTitreFoncier")}</span>
            <input value={nouveauBien.titreFoncier} onChange={(e) => setNouveauBienField("titreFoncier", e.target.value)} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
            <input type="checkbox" checked={nouveauBien.borne} onChange={(e) => setNouveauBienField("borne", e.target.checked)} />
            {t("plansQuartier.fieldBorne")}
          </label>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-ghost btn-small" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        {onIgnore && (
          <button type="button" className="btn btn-ghost btn-small" onClick={onIgnore}>
            {t("plansQuartier.ignoreLot")}
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary btn-small"
          disabled={mode === "existing" ? !numeroLot || !bienReference : !numeroLot || !nouveauBienValide}
          onClick={handleConfirm}
        >
          {mode === "existing" ? t("plansQuartier.linkToBien") : t("plansQuartier.createBien")}
        </button>
      </div>
    </div>
  );
}
