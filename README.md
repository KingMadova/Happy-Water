# 💧 Hydra — Votre rappel d'eau intelligent

<p align="center">
  <img src="assets/drop-3d.png" width="200" alt="Hydra logo" />
</p>

<p align="center">
  <em>Une app React Native pour s'hydrater intelligemment, sans compte, sans serveur.</em>
</p>

## ✨ Fonctionnalités

- 🎯 **Objectif personnalisé** : votre poids × 30 ml/kg (ou 35 ml/kg par temps chaud)
- 🌦️ **Ajusté à la météo** : via Open-Meteo, avec seuil de chaleur configurable
- 🔔 **Rappels intelligents** : notifications locales avec bouton "+250 ml" direct, son personnalisé "plouf d'eau"
- 📊 **Historique 7 jours** : barres de progression et récap objectif atteint
- 🌊 **Jauge animée** : vagues Reanimated + goutte 3D
- 🔒 **100% local** : vos données restent sur votre téléphone (AsyncStorage)

## 🎨 Design

- Thème **nuit aquatique** (glassmorphism + dégradés bleu/cyan)
- Goutte d'eau 3D signature (générée via DALL·E, optimisée à 46 Ko)
- Icônes tab bar 3D (maison, horloge, engrenage)
- Animations spring sur tous les boutons

## 🛠️ Stack technique

- **Expo SDK 57** + **React Native**
- **Expo Router** (navigation par fichiers)
- **Zustand** (state management + persistence AsyncStorage)
- **Reanimated 3** (animations fluides)
- **expo-blur** (glassmorphism)
- **expo-notifications** (rappels locaux avec son personnalisé)
- **TypeScript** (strict)

## 📱 Installation locale

```bash
git clone https://github.com/TON_USERNAME/hydra.git
cd hydra
npm install
npx expo start


Puis scanne le QR code avec Expo Go (Android/iOS).
⚠️ Les notifications locales nécessitent un development build :
eas build --profile development --platform android

🏗️ Builds
Le projet utilise EAS Build :
# APK de test (distribution interne)
eas build --profile preview --platform android

# Build de production
eas build --profile production --platform android


📂 Structure

hydra/
├── app/                    # Écrans (expo-router)
│   ├── (tabs)/             # Navigation par onglets
│   │   ├── index.tsx       # Dashboard (jauge + CTA)
│   │   ├── history.tsx     # Historique 7 jours
│   │   ├── settings.tsx    # Paramètres complets
│   │   └── _layout.tsx     # Tab bar glassmorphique
│   ├── onboarding.tsx      # 3 écrans d'onboarding
│   ├── index.tsx           # Router (onboarding vs tabs)
│   └── _layout.tsx         # Layout racine
├── components/             # Composants UI réutilisables
│   ├── AppBackground.tsx   # Fond nuit aquatique + orbes
│   ├── GlassCard.tsx       # Carte en verre
│   ├── PressScale.tsx      # Animation spring au tap
│   ├── WaterRing.tsx       # Jauge d'eau animée
│   ├── QuantityChips.tsx   # Chips 100/250/500 ml
│   ├── WeatherBadge.tsx    # Badge météo
│   └── Stepper.tsx         # Stepper poids
├── src/
│   ├── constants/theme.ts  # Tokens design nuit aquatique
│   ├── services/           # weather, notifications
│   ├── store/              # Zustand + persistence
│   └── utils/              # Formules hydratation, dates
├── assets/                 # PNG 3D + icônes
└── scripts/                # Génération son + optimisation images

🔔 Notifications
Les notifications sont 100% locales :
Pas de serveur push (pas de FCM/APNs à configurer)
Son personnalisé water-drop.wav (synthétisé, ou remplaçable par un enregistrement)
Bouton "+250 ml 💧" depuis la notification (même app fermée)
🤝 Contribuer
PR bienvenues ! Merci de :
Respecter la convention de commits (feat:, fix:, chore:...)
Faire passer npx tsc --noEmit avant de soumettre
Tester en development build pour les fonctionnalités natives
📄 Licence
MIT © Alvine Yoka

<p align="center">
Fait avec ❤️ et Expo · Stay hydrated 💧
</p>


---

## 🌐 Étape 3 — Créer le repo sur GitHub

1. Va sur **https://github.com/new**
2. Remplis :
   - **Repository name** : `hydra` (ou `happy-water`, ce que tu préfères)
   - **Description** : "💧 Rappel d'eau intelligent — React Native + Expo"
   - **Public** ou **Private** (à toi de voir)
   - ❌ **Ne coche PAS** "Add README", "Add .gitignore", "Add license" (on a déjà tout en local)
3. Clique **Create repository**

GitHub t'affiche une page avec les commandes à exécuter → on va les utiliser.

---

## 🚀 Étape 4 — Ajouter le remote et pusher

**Copie l'URL de ton repo** (format : `https://github.com/TON_USERNAME/hydra.git`) puis :

```bash
# Ajouter le remote GitHub
git remote add origin https://github.com/TON_USERNAME/hydra.git

# Vérifier qu'il est bien ajouté
git remote -v

# Renommer la branche en main (convention moderne)
git branch -M main

# Premier push (force pour aligner si ton historique local diffère du vide GitHub)
git push -u origin main

Alternative via SSH (plus propre, pas de mot de passe à chaque fois) :

git remote add origin git@github.com:TON_USERNAME/hydra.git


git add LICENSE
git commit -m "chore: add MIT license"
git push