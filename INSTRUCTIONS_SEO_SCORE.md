# Instructions pour la migration du Score SEO

## Étapes à suivre dans Supabase

1. **Se connecter à Supabase**
   - Allez sur [https://supabase.com](https://supabase.com)
   - Connectez-vous à votre compte
   - Sélectionnez votre projet RedacSeo

2. **Accéder à l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New query" pour créer une nouvelle requête

3. **Copier et exécuter le script SQL**
   - Ouvrez le fichier `backend/MIGRATION_SEO_SCORE.sql`
   - Copiez tout le contenu du fichier
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur "Run" (ou appuyez sur Ctrl+Enter)

4. **Vérifier que la migration s'est bien passée**
   - Dans le menu de gauche, cliquez sur "Table Editor"
   - Cliquez sur la table "articles"
   - Vérifiez qu'une nouvelle colonne "seo_score" a été ajoutée

## Nouvelle colonne

La colonne `seo_score` contient:
- Type: INTEGER
- Valeur par défaut: 0
- Description: Score SEO de l'article calculé sur 100 points

## Comment fonctionne le score SEO

Le score SEO est calculé automatiquement lors de la sauvegarde d'un article en fonction des règles SEO:
- Chaque règle respectée ajoute des points au score
- Le score maximum est 100 points
- Le score est affiché sur le Dashboard avec des statistiques

### Critères évalués (12 critères au total):

1. **Longueur du contenu (15 points)**
   - ≥800 mots = 15 points
   - ≥500 mots = 13 points
   - ≥300 mots = 11 points
   - ≥150 mots = 8 points
   - ≥50 mots = 5 points

2. **Mot-clé dans le titre (12 points + bonus)**
   - Au début du titre = 12 points
   - Dans les 10 premiers caractères = 10 points
   - Ailleurs dans le titre = 8 points

3. **Mot-clé dans la meta description (8 points)**

4. **Longueur de la meta description (8 points)**
   - 120-160 caractères = 8 points (optimal)
   - 100-119 caractères = 6 points
   - 50-99 caractères = 4 points

5. **Densité du mot-clé (12 points)**
   - 1-2.5% = 12 points (optimal)
   - 0.5-1% = 10 points
   - 2.5-4% = 7 points

6. **Structure H1 (10 points + 3 bonus)**
   - Exactement 1 H1 = 10 points
   - H1 contenant le mot-clé = +3 points bonus

7. **Structure H2/H3 (10 points)**
   - ≥3 H2 = 6 points
   - ≥2 H2 = 5 points
   - ≥2 H3 = 4 points
   - ≥1 H3 = 3 points

8. **Contenu en gras (5 points)**
   - ≥5 balises strong = 5 points
   - ≥3 balises strong = 4 points

9. **Longueur du titre (5 points)**
   - 30-60 caractères = 5 points (optimal)
   - 20-29 caractères = 3 points
   - 60-70 caractères = 3 points

10. **Mot-clé dans les 100 premiers mots (5 points)**

11. **Présence d'un titre (5 points bonus)**

12. **Présence d'une meta description (2 points bonus)**

### Conseils pour obtenir un score élevé:
- Rédigez au moins 300 mots (idéal: 500-800 mots)
- Placez votre mot-clé au début du titre
- Utilisez le mot-clé 1-2.5% du contenu (ex: 5-10 fois pour 500 mots)
- Créez une meta description de 120-160 caractères avec le mot-clé
- Utilisez 1 seul H1 contenant le mot-clé
- Structurez avec au moins 2-3 H2 et quelques H3
- Mettez en gras 3-5 éléments importants
- Mentionnez le mot-clé dans les 100 premiers mots

## Fonctionnalités ajoutées

### Backend
- ✅ Nouvelle colonne `seo_score` dans la table articles
- ✅ Calcul automatique du score SEO lors de la sauvegarde
- ✅ Support du score SEO dans les API create/update

### Frontend
- ✅ Calcul du score SEO basé sur les règles existantes
- ✅ Affichage du score SEO sur chaque article du Dashboard
- ✅ Statistiques SEO globales sur le Dashboard:
  - Score SEO moyen
  - Nombre d'articles avec un bon score (≥70)
  - Distribution des scores
