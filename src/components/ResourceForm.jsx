import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ChevronDown } from "lucide-react";

function initialStateFromFields(fields, initialValues) {
  const state = {};
  for (const field of fields) {
    if (initialValues && initialValues[field.key] !== undefined) {
      state[field.key] = initialValues[field.key];
    } else if (field.type === "checkbox") {
      state[field.key] = field.default ?? false;
    } else {
      state[field.key] = field.default ?? "";
    }
  }
  return state;
}

export default function ResourceForm({ fields, initialValues, onSubmit, onCancel, submitLabel }) {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => initialStateFromFields(fields, initialValues));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function setValue(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message || t("common.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="resource-form">
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="icon-sm" />
          <span>{error}</span>
        </div>
      )}

      {fields.map((field) => {
        const Icon = field.icon;

        if (field.type === "checkbox") {
          return (
            <label className="field field-inline" key={field.key}>
              <input
                type="checkbox"
                checked={Boolean(values[field.key])}
                onChange={(e) => setValue(field.key, e.target.checked)}
              />
              <span>{field.label}</span>
            </label>
          );
        }

        return (
          <label className="field" key={field.key}>
            <span>
              {field.label}
              {field.required ? " *" : ""}
            </span>

            {field.type === "textarea" && (
              <textarea
                value={values[field.key] ?? ""}
                onChange={(e) => setValue(field.key, e.target.value)}
                required={field.required}
                rows={field.rows || 3}
                placeholder={field.placeholder}
                dir={field.dir}
              />
            )}

            {field.type === "select" && (
              <div className={"field-select-wrap" + (Icon ? " field-icon-wrap" : "")}>
                {Icon && <Icon className="icon" />}
                <select
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  required={field.required}
                >
                  <option value="">{field.placeholder || t("common.chooseOption")}</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="icon chevron" />
              </div>
            )}

            {field.type === "file" && (
              <>
                {typeof values[field.key] === "string" && values[field.key] && (
                  <img
                    src={values[field.key]}
                    alt=""
                    style={{
                      maxWidth: 160,
                      maxHeight: 100,
                      borderRadius: 8,
                      display: "block",
                      marginBottom: "0.5rem",
                      border: "1px solid var(--border)",
                    }}
                  />
                )}
                <input
                  type="file"
                  accept={field.accept || "image/*"}
                  onChange={(e) => setValue(field.key, e.target.files[0] || null)}
                />
              </>
            )}

            {field.type === "multiselect" && (
              <select
                multiple
                value={(values[field.key] ?? []).map(String)}
                onChange={(e) =>
                  setValue(
                    field.key,
                    Array.from(e.target.selectedOptions).map((o) => o.value)
                  )
                }
                size={Math.min(6, (field.options || []).length || 3)}
              >
                {(field.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {(!field.type || ["text", "number", "date", "email"].includes(field.type)) &&
              (Icon ? (
                <div className="field-icon-wrap">
                  <Icon className="icon" />
                  <input
                    type={field.type || "text"}
                    value={values[field.key] ?? ""}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    required={field.required}
                    step={field.step}
                    placeholder={field.placeholder}
                    dir={field.dir}
                  />
                </div>
              ) : (
                <input
                  type={field.type || "text"}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  required={field.required}
                  step={field.step}
                  placeholder={field.placeholder}
                  dir={field.dir}
                />
              ))}

            {field.help && <small className="field-help">{field.help}</small>}
          </label>
        );
      })}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? t("common.saving") : submitLabel || t("common.save")}
        </button>
      </div>
    </form>
  );
}
