import { useCallback, useEffect, useState } from "react";
import { api } from "./client";

/** Charge une liste (paginee ou non) depuis l'API et expose un reload + des mutations locales. */
export function useResource(endpoint, params) {
  const paramsKey = JSON.stringify(params ?? null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.list(endpoint, params);
      setItems(data);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, paramsKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload, setItems };
}
