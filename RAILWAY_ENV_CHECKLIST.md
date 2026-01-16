# ✅ Checklist des Variables d'Environnement pour Railway

Copiez-collez ces variables dans Railway → Variables

---

## Variables à configurer:

### 1. NODE_ENV
```
NODE_ENV=production
```

### 2. PORT
```
PORT=3000
```

### 3. FRONTEND_URL (temporaire, à changer après déploiement Vercel)
```
FRONTEND_URL=https://temporary-url.vercel.app
```
⚠️ À MODIFIER après avoir déployé sur Vercel!

### 4. SUPABASE_URL
```
SUPABASE_URL=https://umwovwfimonwkrlkbcec.supabase.co
```
📍 Trouvé dans: Supabase → Settings → API → Project URL

### 5. SUPABASE_SERVICE_KEY
```
SUPABASE_SERVICE_KEY=votre_service_role_key_ici
```
📍 Trouvé dans: Supabase → Settings → API → service_role key (cliquez "Reveal")
⚠️ GARDEZ CETTE CLÉ SECRÈTE!

### 6. JWT_SECRET (générez une clé aléatoire sécurisée)
```
JWT_SECRET=votre_jwt_secret_32_caracteres_minimum
```
💡 Pour générer: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 7. JWT_EXPIRES_IN
```
JWT_EXPIRES_IN=7d
```

---

## ❌ Variables NON NÉCESSAIRES:

- `DATABASE_URL` - Pas besoin, on utilise supabase-js
- `SUPABASE_ANON_KEY` - Seulement pour le frontend

---

## 🔄 Après le déploiement sur Vercel:

N'oubliez pas de revenir dans Railway et modifier:
```
FRONTEND_URL=https://votre-site.vercel.app
```

Puis redéployez le backend!
