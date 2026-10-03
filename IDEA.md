# SPECIFICATION PROJET — "HYDRA" 💧
## Application de rappel d'hydratation quotidienne — React Native / Expo

---

## 1. VISION & PÉRIMÈTRE

Hydra est une application mobile simple qui rappelle à l'utilisateur de boire de l'eau
tout au long de la journée via des notifications push LOCALES, et suit sa consommation
par rapport à un objectif personnalisé.

Personnalisation de l'objectif : basée sur le poids de l'utilisateur ET la météo
température réelle en temps réel.

Périmètre MVP :
- 100% offline-first : aucune backend, aucun compte, aucune donnée envoyée sur un serveur.
- Notifications 100% locales (pas de serveur push).
- Données persistées localement sur l'appareil.
- UI entièrement en français.

---

## 2. STACK TECHNIQUE (IMPOSÉE)

- React Native + Expo (dernier SDK stable), langage TypeScript.
- Routage : expo-router (file-based routing).
- État global : Zustand + middleware persist → @react-native-async-storage/async-storage.
- Notifications : expo-notifications (notifications locales planifiées).
- Géolocalisation : expo-location.
- Météo : API Open-Meteo (gratuite, SANS clé API) :
  GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code
- Anneau de progression : react-native-svg.
- Dégradés : expo-linear-gradient.
- Icônes : lucide-react-native.
- Sliders : @react-native-community/slider.
- Sélecteurs d'heure : @react-native-community/datetimepicker.
- Style : StyleSheet natif + tokens centralisés dans src/constants/theme.ts.
- Contrainte : compatible Expo Go (aucun module natif hors SDK Expo).

---

## 3. LOGIQUE MÉTIER (CŒUR DE L'APP)

Formule d'hydratation :
  objectifMl = poidsKg × coefficient
  coefficient = 30 ml/kg (temps frais)  OU  35 ml/kg (temps chaud)

Détermination chaud/frais :
- Mode "auto" (par défaut) : température réelle via Open-Meteo.
  Chaud si temperatureC >= heatThreshold.
- heatThreshold : 27°C par défaut, CONFIGURABLE dans les Settings (slider 20–35°C).
- Mode manuel (fallback ou choix) : segmented control "Frais · 30 ml/kg" / "Chaud · 35 ml/kg".

Règles de fallback (obligatoires) :
- Permission GPS refusée OU réseau indisponible → temperatureC = null →
  bascule affichée sur le mode manuel (segmented control), message "Météo indisponible — mode manuel".
- Si une température en cache a moins de 3h, elle reste utilisable offline.

Refresh météo : au lancement de l'app + toutes les 3 heures en foreground.

Rollover journalier : les logs sont indexés par date locale "YYYY-MM-DD".
Nouveau jour = compteur du jour remis à 0 automatiquement.

Priorité de l'objectif (du plus prioritaire au moins prioritaire) :
  1. manualGoalOverrideMl (si l'utilisateur a bougé le slider "Ajustement manuel")
  2. poidsKg × coefficient (auto ou manuel selon le toggle météo)

---

## 4. MODÈLE DE DONNÉES (store Zustand persisté)

Shape de l'état (TypeScript) :

    interface HydraState {
      onboarding: { done: boolean };
      profile: {
        weightKg: number;              // défaut 70, bornes 30–150, pas de 1
      };
      weather: {
        autoEnabled: boolean;          // toggle "Météo automatique (API)", défaut true
        mode: 'auto' | 'frais' | 'chaud';
        temperatureC: number | null;   // null = indisponible
        fetchedAt: string | null;      // ISO
      };
      settings: {
        heatThresholdC: number;        // défaut 27, bornes 20–35
        manualGoalOverrideMl: number | null;  // null = pas d'override
        remindersEnabled: boolean;     // défaut true
        startHour: number;             // défaut 8  (08:00)
        endHour: number;               // défaut 22 (22:00)
        frequencyHours: number;        // défaut 2 (choix: 1, 2, 3, 4)
      };
      logs: Record<string, {           // clé = "YYYY-MM-DD"
        totalMl: number;
        entries: { ml: number; at: string }[];
      }>;                              // conserver 30 jours glissants
    }

    // Dérivés (non persistés, calculés) :
    // coefficient = getCoefficient(temperatureC, autoEnabled ? 'auto' : mode, heatThresholdC)
    // computedGoalMl = weightKg × coefficient
    // dailyGoalMl = manualGoalOverrideMl ?? computedGoalMl

Actions attendues : addIntake(ml), setWeight(kg), setWeatherMode(mode), toggleWeatherAuto(bool),
setHeatThreshold(c), setManualGoal(ml|null), setReminderSettings(...), resetDay_ifNewDay(),
completeOnboarding().

Utilitaire pur (src/utils/hydration.ts), testable sans UI :
- getCoefficient(temperatureC, mode, heatThreshold) → 30 | 35
- computeDailyGoalMl(weightKg, coefficient) → number (ml)
- formatLiters(ml) → string FR ("2,45 L") via toLocaleString('fr-FR')

---

## 5. ÉCRANS & NAVIGATION (expo-router)

app/index.tsx
- Aiguillage : si !onboarding.done → redirect /onboarding, sinon → /(tabs).

app/onboarding.tsx — 3 étapes (pager ou étapes séquentielles) :
1. Bienvenue : mascotte goutte d'eau, titre "Hydra", sous-titre "Votre rappel d'eau quotidien", CTA "Commencer".
2. Votre profil : stepper poids (boutons − / +, affichage "70 kg") ; carte pédagogique
   "La formule : Poids × 30 ml = objectif" avec exemple dynamique recalculé en direct
   ("70 kg × 30 ml = 2,1 L/jour") ; CTA "Continuer".
3. Météo temps réel : demande permission GPS puis carte météo (icône + "31°C") ;
   explication "S'il fait chaud : Poids × 35 ml" + exemple calculé ("70 kg × 35 ml = 2,45 L/jour") ;
   toggle "Ajustement automatique" ; CTA "C'est parti !" → onboarding.done = true.

app/(tabs)/index.tsx — DASHBOARD :
- Date du jour localisée FR en haut ("Mercredi 22 mai").
- Badge météo sous la date : "☀ 31°C · coefficient ×35 ml/kg".
- Anneau central de progression : cercle SVG rempli selon totalMl / dailyGoalMl,
  effet visuel "eau" (dégradé bleu/cyan, vague animée optionnelle en MVP),
  texte centré "1,7L / 2,45L".
- Chips de quantité : 100ml / 250ml / 500ml (sélectionne la quantité du CTA).
- CTA principal dégradé bleu→cyan, libellé dynamique "+250ml" (quantité sélectionnée) ;
  tap = ajoute au log du jour (feedback visuel : animation/pulse).
- Tab bar : Home / Historique / Paramètres.

app/(tabs)/history.tsx — HISTORIQUE :
- 7 derniers jours : barre ou ligne par jour avec totalMl vs objectif du jour,
  mise en évidence des jours où objectif atteint.

app/(tabs)/settings.tsx — PARAMÈTRES (cartes blanches arrondies) :
- Carte "Mon profil" : stepper poids (− / +).
- Carte "Objectif quotidien calculé" :
  • badge météo live ("☀ 31°C · temps chaud") ;
  • formule affichée en clair ("70 kg × 35 ml/kg") ;
  • résultat en grand ("2,45 L / jour") ;
  • toggle "Météo automatique (API)" ;
  • segmented control "Frais · 30 ml/kg" / "Chaud · 35 ml/kg" (actif si toggle OFF ou fallback) ;
  • slider "Ajustement manuel" (1–4 L, pas 50 ml) + lien "Réinitialiser au calcul auto"
    (remet manualGoalOverrideMl à null).
- Carte "Seuil de chaleur" : slider 20–35°C, valeur affichée ("27°C").
- Carte "Rappels" : toggle ON/OFF ; chips/pickers "Début : 08:00" et "Fin : 22:00"
  (DateTimePicker mode time) ; fréquence (choix 1h / 2h / 3h / 4h).
- Toute activation des rappels déclenche la demande de permission de notification si non acquise.

---

## 6. SERVICE NOTIFICATIONS (expo-notifications, local uniquement)

- Créer un canal Android au démarrage (importance default).
- setNotificationHandler : afficher bannière même en foreground.
- Planification : à chaque changement de (remindersEnabled, startHour, endHour, frequencyHours) :
  1. cancelAllScheduledNotificationsAsync()
  2. si enabled : pour chaque créneau h entre startHour et endHour (pas = frequencyHours) :
     scheduleNotificationAsync avec trigger DailyTriggerInput { hour: h, minute: 0 }.
- Contenu : titre "Hydrate-toi 💧", corps dynamique :
  "Tu as bu X L sur Y L aujourd'hui. Un verre d'eau ?"
- remindersEnabled = false → aucune notification planifiée.

---

## 7. SERVICE MÉTÉO (src/services/weather.ts)

- expo-location : requestForegroundPermissionsAsync() ; si accordée :
  getCurrentPositionAsync({ accuracy: Balanced }) → { latitude, longitude }.
- Fetch Open-Meteo (URL ci-dessus, champ current.temperature_2m).
- Met à jour le store : temperatureC, fetchedAt.
- Timer foreground : refresh toutes les 3h.
- Gestion d'erreur stricte : toute erreur (réseau, GPS refusé, timeout 8s)
  → temperatureC = null, JAMAIS de crash.

---

## 8. DESIGN SYSTEM

- Fond : dégradé très clair bleu ciel (#EAF6FB → #DFF7F4).
- Cartes : blanc, borderRadius 16–24, ombre légère.
- Primaire : dégradé horizontal #4A90D9 → #2DD4BF (CTA, anneau).
- Texte principal : #0F2A43 ; texte secondaire : gris-bleu.
- Boutons : forme pill (borderRadius = hauteur/2).
- Nombres : bold, grands ; format FR obligatoire ("2,45 L", virgule décimale).
- Icônes lucide : Droplets, Home, Clock/History, Settings, Sun, Snowflake, Minus, Plus.
- Anneau : react-native-svg (circle strokeDasharray/strokeDashoffset + LinearGradient SVG).

---

## 9. ARCHITECTURE DE FICHIERS

    app/
      _layout.tsx            # Stack racine + init (canal notif, rollover, refresh météo)
      index.tsx              # Aiguillage onboarding / tabs
      onboarding.tsx
      (tabs)/
        _layout.tsx          # Tab bar Home / Historique / Paramètres
        index.tsx            # Dashboard
        history.tsx
        settings.tsx
    components/
      WaterRing.tsx
      WeatherBadge.tsx
      QuantityChips.tsx
      Stepper.tsx
      SettingCard.tsx
    src/
      constants/theme.ts
      services/weather.ts
      services/notifications.ts
      store/useHydrationStore.ts
      utils/hydration.ts
    app.json                 # plugins: expo-router, expo-location (permission FR), expo-notifications

app.json — plugins requis :
- "expo-router"
- ["expo-location", { "locationWhenInUsePermission": "Hydra utilise votre position pour récupérer la météo locale et ajuster votre objectif d'eau." }]
- "expo-notifications"

---

## 10. CRITÈRES D'ACCEPTATION (Definition of Done)

1. Premier lancement → onboarding 3 écrans ; l'exemple de la formule se recalcule en direct quand le poids change.
2. Fin d'onboarding → dashboard cohérent : objectif = poids × coefficient (météo ou fallback).
3. Tap CTA → anneau + compteur incrémentés ; valeur conservée après kill/restart de l'app.
4. Changement de jour → compteur à 0 ; jour précédent visible dans l'historique.
5. Settings : poids, seuil, toggle météo, segmented, slider, rappels → persistés et effet immédiat sur objectif ET notifications.
6. Rappels ON → notifications quotidiennes sur chaque créneau défini ; OFF → aucune.
7. Mode avion / GPS refusé → app fonctionnelle, badge météo en fallback, mode manuel disponible, zéro crash.
8. Format des nombres en français partout (virgule décimale).

---

## 11. ORDRE DE BUILD (MILESTONES)

M1 : setup Expo + theme.ts + utils/hydration.ts (logique pure).
M2 : store Zustand + persist + rollover journalier.
M3 : onboarding (3 écrans).
M4 : dashboard (anneau, chips, CTA, badge météo).
M5 : settings (toutes cartes).
M6 : service météo (location + Open-Meteo) branché au store.
M7 : service notifications (planification créneaux).
M8 : historique 7 jours.
M9 : polish (animations, états vides/erreur, icône & splash).

---

## 12. CONTRAINTES TRANSVERSES

- Aucun backend, aucun compte, aucune donnée personnelle sortante (la position sert
  uniquement au fetch météo ponctuel, jamais stockée ni transmise ailleurs).
- Compatible Expo Go.
- Textes UI 100% français.
- Code TypeScript strict, composants typés, pas de `any`.
