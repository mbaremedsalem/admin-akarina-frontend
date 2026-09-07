import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Images,
  Image as ImageIcon,
  ListOrdered,
  MessageSquareText,
  Save,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import { api } from "../api/client";
import { useResource } from "../api/useResource";

export default function BienMediasPage() {
  const { t, i18n } = useTranslation();
  const BackIcon = i18n.dir() === "rtl" ? ArrowRight : ArrowLeft;
  const TYPE_MEDIA_OPTIONS = [
    { value: "image", label: t("medias.typeImage") },
    { value: "video", label: t("medias.typeVideo") },
  ];

  const { bienId } = useParams();
  const { items: medias, loading, error, reload, setItems } = useResource("/medias/", { bien: bienId });
  const { items: biens } = useResource("/biens/");
  const bien = biens.find((b) => String(b.id) === String(bienId));

  const [typeMedia, setTypeMedia] = useState("image");
  const [legende, setLegende] = useState("");
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  async function handleUpload(e) {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setUploadError(t("medias.noFileSelected"));
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("bien", bienId);
      formData.append("type_media", typeMedia);
      formData.append("legende", legende);
      Array.from(files).forEach((f) => formData.append("fichier", f));
      await api.post("/medias/", formData, { isFormData: true });
      setLegende("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      reload();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(media) {
    if (!window.confirm(t("medias.confirmDeleteMedia"))) return;
    try {
      await api.del(`/medias/${media.id}/`);
      setItems((prev) => prev.filter((m) => m.id !== media.id));
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function handleUpdateMeta(media, legendeValue, ordreValue) {
    try {
      await api.patch(`/medias/${media.id}/`, { legende: legendeValue, ordre: Number(ordreValue) || 0 });
      reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="resource-page">
      <div className="page-header">
        <h1>
          <span className="page-header-icon">
            <Images className="icon" strokeWidth={2} />
          </span>
          {bien ? (
            <>
              {t("medias.titleWithBien")}{" "}
              <span className="muted" style={{ fontWeight: 500 }}>
                - {bien.reference} ({bien.titre})
              </span>
            </>
          ) : (
            t("medias.titleNoBien", { id: bienId })
          )}
        </h1>
        <div className="page-header-actions">
          <Link className="btn btn-ghost" to="/biens">
            <BackIcon className="icon-sm" />
            {t("medias.back")}
          </Link>
        </div>
      </div>

      <form className="upload-panel" onSubmit={handleUpload}>
        <h2>
          <UploadCloud className="icon-sm" />
          {t("medias.uploadTitle")}
        </h2>
        <p className="muted">{t("medias.uploadHelp")}</p>
        {uploadError && (
          <div className="alert alert-error">
            <AlertCircle className="icon-sm" />
            <span>{uploadError}</span>
          </div>
        )}
        <div className="field-row">
          <label className="field">
            <span>{t("medias.type")}</span>
            <div className="field-select-wrap field-icon-wrap">
              {typeMedia === "image" ? <ImageIcon className="icon" /> : <Video className="icon" />}
              <select value={typeMedia} onChange={(e) => setTypeMedia(e.target.value)}>
                {TYPE_MEDIA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="field">
            <span>{t("medias.legend")}</span>
            <div className="field-icon-wrap">
              <MessageSquareText className="icon" />
              <input
                value={legende}
                onChange={(e) => setLegende(e.target.value)}
                placeholder={t("medias.legendPlaceholder")}
              />
            </div>
          </label>
        </div>
        <label className="field">
          <span>{t("medias.files")}</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={typeMedia === "image" ? "image/*" : "video/*"}
          />
        </label>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={uploading}>
            <UploadCloud className="icon-sm" />
            {uploading ? t("medias.sending") : t("medias.send")}
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert-error">
          <AlertCircle className="icon-sm" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="page-loading">{t("common.loading")}</div>
      ) : medias.length === 0 ? (
        <div className="empty-state">
          <Images className="icon" />
          {t("medias.empty")}
        </div>
      ) : (
        <div className="media-grid">
          {medias.map((media) => (
            <MediaCard key={media.id} media={media} onDelete={handleDelete} onUpdateMeta={handleUpdateMeta} />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaCard({ media, onDelete, onUpdateMeta }) {
  const { t } = useTranslation();
  const [legende, setLegende] = useState(media.legende || "");
  const [ordre, setOrdre] = useState(media.ordre ?? 0);

  return (
    <div className="media-card">
      <div className="media-card-media">
        <span className="media-card-type">
          {media.type_media === "image" ? <ImageIcon className="icon-sm" /> : <Video className="icon-sm" />}
          {media.type_media === "image" ? t("medias.typeImage") : t("medias.typeVideo")}
        </span>
        {media.type_media === "image" ? (
          <img src={media.fichier} alt={media.legende || ""} />
        ) : (
          <video src={media.fichier} controls />
        )}
      </div>
      <div className="media-card-body">
        <label className="field">
          <span>{t("medias.legend")}</span>
          <div className="field-icon-wrap">
            <MessageSquareText className="icon" />
            <input value={legende} onChange={(e) => setLegende(e.target.value)} />
          </div>
        </label>
        <label className="field">
          <span>{t("medias.order")}</span>
          <div className="field-icon-wrap">
            <ListOrdered className="icon" />
            <input type="number" value={ordre} onChange={(e) => setOrdre(e.target.value)} />
          </div>
        </label>
        <div className="row-actions">
          <button className="btn btn-small" type="button" onClick={() => onUpdateMeta(media, legende, ordre)}>
            <Save className="icon-sm" />
            {t("common.save")}
          </button>
          <button className="btn btn-small btn-danger" type="button" onClick={() => onDelete(media)}>
            <Trash2 className="icon-sm" />
            {t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
