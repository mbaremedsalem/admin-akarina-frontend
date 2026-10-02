# Agharina — Admin Frontend

Back-office d'**Agharina**, plateforme immobilière mauritanienne. Permet à l'équipe interne de gérer le catalogue de biens, les utilisateurs, les transactions et le programme de fidélité de la plateforme client ([agharina-frontend-client.vercel.app](https://agharina-frontend-client.vercel.app/)).

## Modules

- **Utilisateurs** — gestion des comptes clients.
- **Référentiels géographiques** — villes et quartiers.
- **Équipements** — caractéristiques associables aux biens.
- **Biens** — création/édition des biens (actifs et inactifs), médias associés, indisponibilités (calendrier de disponibilité).
- **Transactions** — suivi des ventes et locations, avec statuts (en attente, confirmée, annulée, terminée).
- **Cadeaux & fidélité** — catalogue de cadeaux (points requis, valeur, stock) et suivi des échanges de cadeaux.
- **Offres** — gestion des offres proposées aux clients.
- **Authentification** — connexion protégée par route (`ProtectedRoute` + `AuthContext`).

## Stack technique

- [React 19](https://react.dev/) + [React Router 7](https://reactrouter.com/)
- [Vite 5](https://vitejs.dev/)
- [i18next](https://www.i18next.com/) / react-i18next
- [Leaflet](https://leafletjs.com/) / react-leaflet (sélection de localisation)
- [lucide-react](https://lucide.dev/) (icônes)

## Démarrer le projet

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production
npm run preview  # prévisualiser le build
```

## Configuration

L'URL de l'API backend se configure via la variable d'environnement `VITE_API_URL` (par défaut `http://127.0.0.1:8000/api` en développement).

```bash
# .env
VITE_API_URL=https://votre-api.example.com/api
```

## Structure

```
src/
  api/         # client HTTP
  components/  # Layout, Modal, ProtectedRoute, ResourcePage, ResourceForm,
               # LocationPicker, AvailabilityCalendar, LanguageSwitcher, SearchToggle
  context/     # AuthContext
  pages/       # UtilisateursPage, VillesPage, QuartiersPage, EquipementsPage,
               # BiensPage, BiensInactifsPage, BienForm, BienMediasPage,
               # IndisponibilitesPage, TransactionsPage, CadeauxPage,
               # EchangesCadeauxPage, OffresPage, LoginPage
```
