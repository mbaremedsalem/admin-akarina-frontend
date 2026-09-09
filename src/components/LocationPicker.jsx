import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

const DEFAULT_CENTER = { lat: 18.0858, lng: -15.9785 }; // Nouakchott

const pinIcon = L.divIcon({
  className: "map-marker-wrap",
  html: '<div class="map-marker"></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function ClickToPlace({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange, height = 320 }) {
  const { t } = useTranslation();

  const hasCoords = latitude !== "" && latitude != null && longitude !== "" && longitude != null;
  const position = hasCoords ? [Number(latitude), Number(longitude)] : null;
  const center = useMemo(() => position || [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], [position?.[0], position?.[1]]);

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
        <MapContainer center={center} zoom={position ? 15 : 12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPick={handlePick} />
          {position && (
            <Marker
              position={position}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend(e) {
                  const { lat, lng } = e.target.getLatLng();
                  handlePick(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
