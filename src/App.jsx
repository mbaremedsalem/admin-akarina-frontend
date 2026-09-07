import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UtilisateursPage from "./pages/UtilisateursPage";
import VillesPage from "./pages/VillesPage";
import QuartiersPage from "./pages/QuartiersPage";
import EquipementsPage from "./pages/EquipementsPage";
import BiensPage from "./pages/BiensPage";
import BienMediasPage from "./pages/BienMediasPage";
import IndisponibilitesPage from "./pages/IndisponibilitesPage";
import TransactionsPage from "./pages/TransactionsPage";
import CadeauxPage from "./pages/CadeauxPage";
import EchangesCadeauxPage from "./pages/EchangesCadeauxPage";
import OffresPage from "./pages/OffresPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/utilisateurs" replace />} />
        <Route path="utilisateurs" element={<UtilisateursPage />} />
        <Route path="villes" element={<VillesPage />} />
        <Route path="quartiers" element={<QuartiersPage />} />
        <Route path="equipements" element={<EquipementsPage />} />
        <Route path="biens" element={<BiensPage />} />
        <Route path="biens/:bienId/medias" element={<BienMediasPage />} />
        <Route path="indisponibilites" element={<IndisponibilitesPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="cadeaux" element={<CadeauxPage />} />
        <Route path="echanges-cadeaux" element={<EchangesCadeauxPage />} />
        <Route path="offres" element={<OffresPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
