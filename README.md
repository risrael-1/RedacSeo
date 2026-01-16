# RedacSeo - Application de Rédaction SEO

Application web complète pour la gestion et l'optimisation de contenus SEO. Créez, éditez et optimisez vos articles en suivant les meilleures pratiques du référencement naturel.

## 🚀 Fonctionnalités

### Authentification
- Inscription et connexion utilisateur
- Gestion de mot de passe oublié
- Stockage sécurisé en localStorage
- Routes protégées

### Gestion des Articles
- Création et sauvegarde d'articles multiples
- Auto-sauvegarde toutes les 30 secondes
- Popup de confirmation animée lors de la sauvegarde
- Liste des articles sauvegardés par utilisateur
- Chargement et suppression d'articles
- Bouton "Effacer" pour réinitialiser le contenu
- Navigation depuis le Dashboard vers l'éditeur
- Synchronisation en temps réel avec le Dashboard
- Compteur de mots en temps réel

### Éditeur SEO
- Éditeur de contenu avec toolbar (gras, H1, H2, H3)
- Gestion des mots-clés principaux et secondaires
- Application manuelle du formatage en gras sur les mots-clés
- Priorité aux expressions longues (ex: "hôtel en Bretagne bord de mer")
- Génération automatique de suggestions de titre SEO (max 65 caractères)
- Génération automatique de meta descriptions (150-160 caractères)

### Vérification SEO
- Configuration personnalisée des règles SEO
- Vérification en temps réel :
  - Longueur du titre (max 65 caractères)
  - Longueur de la meta description (150-160 caractères)
  - Nombre de mots-clés en gras (min 2)
  - Nombre de mots dans l'article (min 300)
  - Nombre de balises H1 (exactement 1)
- Activation/désactivation des règles individuelles

### Interface Utilisateur
- Design moderne et responsive
- Navigation intuitive avec navbar
- Dashboard de gestion des articles avec statistiques
- Édition et suppression d'articles depuis le Dashboard
- Popup de sauvegarde animée avec icône de succès
- Suggestions cliquables pour titre et meta description
- Tags visuels pour les mots-clés secondaires
- Badges de statut colorés (Brouillon, En cours, Terminé)

## 🛠️ Technologies Utilisées

- **React 19.1.0** - Framework JavaScript
- **Vite 6.3.5** - Build tool et dev server
- **React Router DOM 7.12.0** - Navigation et routing
- **Context API** - Gestion d'état globale
- **LocalStorage** - Persistance des données
- **CSS3** - Styling avec gradients et animations

## 📦 Installation

1. Cloner le repository
```bash
git clone <votre-repo-url>
cd RedacSeo
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer l'application en mode développement
```bash
npm run dev
```

4. Ouvrir dans le navigateur
```
http://localhost:5173
```

## 🏗️ Structure du Projet

```
RedacSeo/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Barre de navigation
│   │   └── ProtectedRoute.jsx  # Composant de routes protégées
│   ├── context/
│   │   ├── AuthContext.jsx     # Gestion de l'authentification
│   │   ├── RulesContext.jsx    # Gestion des règles SEO
│   │   └── ArticlesContext.jsx # Gestion des articles
│   ├── pages/
│   │   ├── Login.jsx           # Page de connexion
│   │   ├── Register.jsx        # Page d'inscription
│   │   ├── ForgotPassword.jsx  # Page mot de passe oublié
│   │   ├── Dashboard.jsx       # Tableau de bord
│   │   ├── Redaction.jsx       # Éditeur de contenu SEO
│   │   └── Regles.jsx          # Configuration des règles
│   ├── App.jsx                 # Composant racine avec routing
│   ├── main.jsx                # Point d'entrée de l'application
│   └── index.css               # Styles globaux
├── public/
├── package.json
└── vite.config.js
```

## 📝 Utilisation

### 1. Créer un compte
- Accéder à la page d'inscription
- Entrer votre email et mot de passe
- Se connecter avec vos identifiants

### 2. Rédiger un article
1. Aller dans la section "Rédaction"
2. Donner un nom à votre article
3. Coller ou rédiger votre contenu
4. Cliquer sur "Générer des suggestions" pour obtenir des propositions de titre et meta description
5. Définir votre mot-clé principal et vos mots-clés secondaires
6. Cliquer sur "Appliquer le gras aux mots-clés" pour formater le contenu
7. Choisir parmi les suggestions de titre et meta description
8. Sauvegarder votre article

### 3. Vérifier les règles SEO
- Cliquer sur "Vérifier les règles SEO"
- Consulter les résultats de validation
- Ajuster votre contenu selon les recommandations

### 4. Configurer les règles
- Aller dans "Règles SEO"
- Activer/désactiver les règles selon vos besoins
- Modifier les valeurs minimales/maximales
- Les règles sont sauvegardées automatiquement

## 🎨 Fonctionnalités Clés

### Gestion Intelligente des Mots-Clés
L'application applique les mots-clés en gras avec une logique intelligente :
- Les expressions longues sont traitées en priorité
- Exemple : "hôtel en Bretagne bord de mer" sera mis en gras comme un bloc complet, même si "hôtel en Bretagne" est aussi un mot-clé

### Auto-Sauvegarde
- Sauvegarde automatique toutes les 30 secondes
- Sauvegarde manuelle avec confirmation
- Aucune perte de données en cas de fermeture accidentelle

### Suggestions Intelligentes
- Analyse du contenu pour extraire les mots les plus fréquents
- Génération de titres optimisés SEO
- Meta descriptions respectant les bonnes pratiques (150-160 caractères)

## 🔒 Sécurité

- Authentification requise pour accéder aux fonctionnalités
- Routes protégées avec redirection automatique
- Données utilisateur isolées par email
- Stockage local sécurisé

## 🚧 Scripts Disponibles

```bash
npm run dev          # Lancer en mode développement
npm run build        # Build pour la production
npm run preview      # Preview du build de production
npm run lint         # Linter le code avec ESLint
```

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à me contacter.

---

**Développé avec ❤️ et Claude Sonnet 4.5**
