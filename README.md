# Agharina Admin Frontend

Interface d'administration React (Vite, JavaScript) pour l'API Agharina. Projet
totalement independant du backend Django (`c:\Users\mbare\Desktop\agharina`) :
son propre `package.json`, son propre serveur de developpement, aucune
reference dans les `urls.py`/`static`/`templates` de Django.

## Demarrage

```bash
npm install
npm run dev
```

Par defaut l'app tourne sur `http://localhost:5173` et appelle l'API sur
`http://127.0.0.1:8000/api` (voir `.env`, variable `VITE_API_URL`).

Cote backend, lancer `python manage.py runserver` depuis le dossier
`agharina`. Le CORS est deja active (`corsheaders`, `CORS_ALLOW_ALL_ORIGINS =
DEBUG` dans `config/settings.py`) donc aucune config supplementaire n'est
necessaire en dev.

Seuls les comptes avec `is_staff = True` peuvent se connecter a cette
interface (verifie apres connexion via `GET /profil/`).

## Sections geres

- **Utilisateurs** : liste + affectation des privileges (`est_gestionnaire`,
  `is_staff`, `is_active`) + suppression. La creation de compte reste sur
  l'inscription publique (`/inscription/`).
- **Villes / Quartiers / Equipements** : CRUD complet.
- **Biens immobiliers** : CRUD complet (tous types : ceremonie, duplexe,
  appartement, terrain, commercial) avec champs conditionnels
  (`detail_ceremonie` / `detail_terrain`) et equipements.
- **Medias d'un bien** : ajout d'une ou plusieurs photos/videos en un seul
  appel API (champ fichier repete dans le formdata), modification
  legende/ordre, suppression.
- **Calendrier / indisponibilites**, **Transactions** (avec actions rapides
  confirmer/annuler/terminer), **Cadeaux**, **Echanges de cadeaux** (lecture
  seule), **Offres**.

## Structure

```
src/
  api/client.js        client fetch (auth token, pagination DRF, formdata)
  api/useResource.js    hook de chargement de liste
  context/AuthContext   connexion / deconnexion / profil
  components/           Layout, ProtectedRoute, Modal, ResourcePage/Form
  pages/                une page par ressource
```

`ResourcePage` + `ResourceForm` fournissent un CRUD generique (table +
formulaire modal) pilote par une config de colonnes/champs ; reutilise pour
Villes, Quartiers, Equipements, Cadeaux, Offres, Indisponibilites,
Transactions. Utilisateurs et Biens ont des pages sur-mesure (privileges,
champs conditionnels, medias).
