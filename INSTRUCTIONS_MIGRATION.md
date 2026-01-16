# Instructions pour la migration de la table Projects

## Étapes à suivre dans Supabase

1. **Se connecter à Supabase**
   - Allez sur [https://supabase.com](https://supabase.com)
   - Connectez-vous à votre compte
   - Sélectionnez votre projet RedacSeo

2. **Accéder à l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New query" pour créer une nouvelle requête

3. **Copier et exécuter le script SQL**
   - Ouvrez le fichier `backend/MIGRATION_PROJECTS.sql`
   - Copiez tout le contenu du fichier
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur "Run" (ou appuyez sur Ctrl+Enter)

4. **Vérifier que la migration s'est bien passée**
   - Dans le menu de gauche, cliquez sur "Table Editor"
   - Vous devriez voir une nouvelle table "projects"
   - Cliquez sur la table "articles" et vérifiez qu'une nouvelle colonne "project_id" a été ajoutée

## Structure de la table projects

La table `projects` contient les colonnes suivantes:
- `id` (UUID, clé primaire)
- `user_id` (UUID, référence vers users)
- `name` (VARCHAR 255, nom du projet)
- `description` (TEXT, description optionnelle)
- `color` (VARCHAR 7, couleur hex, défaut: #667eea)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Modification de la table articles

La colonne `project_id` a été ajoutée à la table `articles`:
- Type: UUID
- Nullable: OUI (les articles existants n'ont pas de projet)
- Référence: projects(id) ON DELETE SET NULL
- Si un projet est supprimé, les articles associés auront project_id = NULL

## Fonctionnalités ajoutées

### Backend
- ✅ Controller projectsController.js avec CRUD complet
- ✅ Routes /api/projects protégées par JWT
- ✅ Articles peuvent avoir un project_id

### Frontend
- ✅ Page Projects (/projects) pour gérer les projets
- ✅ Context ProjectsContext pour l'état des projets
- ✅ Dashboard avec filtre par projet
- ✅ Navigation mise à jour avec lien "Projets"
- ✅ ArticlesContext supporte projectId

## Comment utiliser

1. **Créer un projet**
   - Allez sur la page "Projets"
   - Cliquez sur "+ Nouveau Projet"
   - Remplissez le nom (ex: "Hôtel des Bains")
   - Optionnel: ajoutez une description et choisissez une couleur
   - Cliquez sur "Créer"

2. **Associer un article à un projet**
   - Lors de la création/édition d'un article
   - Sélectionnez un projet dans le menu déroulant
   - Les articles sont automatiquement liés au projet

3. **Filtrer les articles par projet**
   - Sur le Dashboard, utilisez le menu déroulant "Filtrer par projet"
   - Sélectionnez un projet pour voir uniquement ses articles
   - Ou sélectionnez "Sans projet" pour les articles non assignés

## Notes importantes

- Les articles existants n'ont pas de projet assigné (project_id = NULL)
- Vous pouvez éditer ces articles pour leur assigner un projet
- Supprimer un projet ne supprime PAS les articles, ils deviennent "Sans projet"
- Chaque projet affiche le nombre d'articles associés
