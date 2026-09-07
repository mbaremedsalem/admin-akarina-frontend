import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) return <div className="page-loading">{t("common.loading")}</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
