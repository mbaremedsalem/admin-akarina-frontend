import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DEFAULT_CENTER = { lat: 18.0858, lng: -15.9785 }; // Nouakchott

export default function LocationPicker({ latitude, longitude, onChange, height = 320 }) {
  const { t } = useTranslation();
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const hasCoords = latitude !== "" && latitude != null && longitude !== "" && longitude != null;
  const position = hasCoords ? { lat: Number(latitude), lng: Number(longitude) } : null;
  const center = useMemo(() => position || DEFAULT_CENTER, [position?.lat, position?.lng]);

  function handlePick(lat, lng) {
    onChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
  }

  return (
    <div className="location-picker-card">
      <div className="location-picker-header">
        <MapPin className="icon-sm" />
        <span>{t("bienForm.mapPickHelp")}</span>
      </div>
      <div className="location-picker-map" style={{ height }}>
        {!GOOGLE_MAPS_API_KEY && <p className="muted">{t("plansQuartier.missingApiKey")}</p>}
        {GOOGLE_MAPS_API_KEY && loadError && <p className="muted">{t("common.genericError")}</p>}
        {GOOGLE_MAPS_API_KEY && !loadError && !isLoaded && <div className="page-loading">{t("common.loading")}</div>}
        {GOOGLE_MAPS_API_KEY && isLoaded && (
          <GoogleMap
            center={center}
            zoom={position ? 15 : 12}
            mapContainerStyle={{ height: "100%", width: "100%" }}
            options={{ streetViewControl: false, fullscreenControl: false }}
            onClick={(e) => handlePick(e.latLng.lat(), e.latLng.lng())}
          >
            {position && (
              <Marker
                position={position}
                draggable
                onDragEnd={(e) => handlePick(e.latLng.lat(), e.latLng.lng())}
              />
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  );
}
