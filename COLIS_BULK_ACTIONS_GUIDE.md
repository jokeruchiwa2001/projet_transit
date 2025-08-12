# Guide des Actions en Lot sur les Colis - TransCargo

## 🎯 Vue d'ensemble

Cette fonctionnalité permet aux administrateurs de gérer efficacement les colis en lot directement depuis le popup de détails des cargaisons, comme demandé dans votre spécification.

## ✨ Fonctionnalités Implémentées

### 🔄 Actions en Lot Disponibles

1. **Marquer tous comme récupérés**
   - Disponible pour tous les colis avec l'état `ARRIVE`
   - Bouton vert avec icône de validation
   - Affiche le nombre de colis éligibles

2. **Marquer tous comme perdus**
   - Disponible pour tous les colis avec l'état `EN_COURS` ou `ARRIVE`
   - Bouton rouge avec icône d'alerte
   - Affiche le nombre de colis éligibles

### 🎨 Interface Utilisateur

#### Dans le Popup de Détails de Cargaison
```
┌─────────────────────────────────────────┐
│ 📦 Détails de la cargaison CG-XXX      │
├─────────────────────────────────────────┤
│ [Informations de la cargaison]         │
├─────────────────────────────────────────┤
│ 🔧 Actions en lot sur les colis        │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ ❌ Marquer tous │ │ ✅ Marquer tous │ │
│ │ comme perdus (3)│ │ comme récup. (2)│ │
│ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────┤
│ 📋 Colis dans cette cargaison :        │
│ [Liste des colis avec actions indiv.]  │
└─────────────────────────────────────────┘
```

## 🔧 Implémentation Technique

### Fichiers Modifiés/Créés

1. **Frontend** - [`public/app.js`](public/app.js)
   - Fonction `viewCargaisonDetails()` mise à jour
   - Nouvelles fonctions `markAllColisAsLost()` et `markAllColisAsRecovered()`
   - Gestion des confirmations et feedback utilisateur

2. **API Backend** - [`api/colis_bulk_actions.js`](api/colis_bulk_actions.js)
   - Logique métier pour les actions en lot
   - Validation des états des colis
   - Gestion des erreurs et transactions

3. **Routes PHP** - [`routes/api_colis_bulk.php`](routes/api_colis_bulk.php)
   - Intégration avec le système PHP existant
   - Endpoints pour les actions individuelles et en lot

### Endpoints API

```
POST /api/colis/{id}/recupere     - Marquer un colis comme récupéré
POST /api/colis/{id}/perdu        - Marquer un colis comme perdu
GET  /api/cargaisons/{id}/colis   - Obtenir les colis d'une cargaison
POST /api/colis/bulk              - Actions en lot sur les colis
GET  /api/cargaisons/{id}/colis/stats - Statistiques des colis
```

## 🚀 Utilisation

### 1. Accéder aux Actions en Lot

1. Cliquez sur le bouton **"Détails"** d'une cargaison
2. Le popup s'ouvre avec les informations de la cargaison
3. La section **"Actions en lot sur les colis"** apparaît si des colis sont présents
4. Les boutons affichent le nombre de colis éligibles pour chaque action

### 2. Marquer tous les Colis comme Récupérés

```javascript
// Automatiquement déclenché par le bouton
markAllColisAsRecovered('CG-XXXXXXXXX');
```

**Conditions :**
- Seuls les colis avec l'état `ARRIVE` sont traités
- Confirmation obligatoire avant exécution
- Feedback en temps réel du nombre de colis traités

### 3. Marquer tous les Colis comme Perdus

```javascript
// Automatiquement déclenché par le bouton
markAllColisAsLost('CG-XXXXXXXXX');
```

**Conditions :**
- Seuls les colis avec l'état `EN_COURS` ou `ARRIVE` sont traités
- Double confirmation pour cette action critique
- Feedback détaillé avec gestion des erreurs

### 4. Actions Individuelles

Chaque colis dans la liste dispose également de boutons individuels :
- **"Récupéré"** - Pour les colis `ARRIVE`
- **"Perdu"** - Pour les colis `EN_COURS` ou `ARRIVE`

## 🔒 Sécurité et Validations

### Validations Côté Client
- Confirmation obligatoire pour toutes les actions en lot
- Double confirmation pour marquer comme "perdu"
- Vérification de la présence de colis éligibles

### Validations Côté Serveur
- Vérification des états des colis avant mise à jour
- Validation des transitions d'état autorisées
- Gestion des erreurs par colis individuel

### Transitions d'État Autorisées

```
EN_ATTENTE → EN_COURS → ARRIVE → RECUPERE
                    ↘     ↓
                      PERDU
```

**Pour "Récupéré" :**
- `ARRIVE` → `RECUPERE` ✅

**Pour "Perdu" :**
- `EN_COURS` → `PERDU` ✅
- `ARRIVE` → `PERDU` ✅

## 📊 Feedback Utilisateur

### Messages de Succès
- `"3 colis marqués comme récupérés"` (succès complet)
- `"2 colis marqués comme perdus (1 échec)"` (succès partiel)

### Messages d'Erreur
- `"Aucun colis éligible trouvé"`
- `"Erreur lors du traitement en lot"`
- `"Colis XXX: état YYY non compatible avec l'action ZZZ"`

### Indicateurs Visuels
- 🔄 Spinner pendant le traitement
- ✅ Notification verte pour les succès
- ⚠️ Notification orange pour les avertissements
- ❌ Notification rouge pour les erreurs

## 🔄 Mise à Jour Automatique

Après chaque action en lot :
1. **Rechargement automatique** du popup de détails (1.5s de délai)
2. **Mise à jour des compteurs** dans les boutons
3. **Actualisation de la liste** des colis avec nouveaux états
4. **Recalcul des actions disponibles** selon les nouveaux états

## 🧪 Tests et Validation

### Scénarios de Test

1. **Test avec cargaison vide**
   - Vérifier l'affichage du message "Aucun colis disponible"

2. **Test avec colis mixtes**
   - Cargaison avec colis dans différents états
   - Vérifier que seuls les colis éligibles sont traités

3. **Test de gestion d'erreurs**
   - Simuler des erreurs réseau
   - Vérifier les messages d'erreur appropriés

4. **Test de performance**
   - Cargaison avec nombreux colis (50+)
   - Vérifier la rapidité du traitement

### Commandes de Test

```bash
# Test de l'API
curl -X POST http://localhost/api/colis/bulk \
  -H "Content-Type: application/json" \
  -d '{"cargaisonId":"CG-TEST","action":"RECUPERE"}'

# Test des statistiques
curl http://localhost/api/cargaisons/CG-TEST/colis/stats
```

## 🔧 Configuration

### Variables Configurables

```javascript
// Dans public/app.js
const BULK_ACTION_DELAY = 1500; // Délai avant rechargement (ms)
const CONFIRMATION_REQUIRED = true; // Confirmation obligatoire
const SHOW_INDIVIDUAL_ACTIONS = true; // Actions individuelles
```

### Personnalisation des Messages

```javascript
const MESSAGES = {
    CONFIRM_LOST: 'Êtes-vous sûr de vouloir marquer TOUS les colis éligibles comme perdus ?',
    CONFIRM_RECOVERED: 'Êtes-vous sûr de vouloir marquer TOUS les colis arrivés comme récupérés ?',
    PROCESSING: 'Traitement en cours...',
    NO_ELIGIBLE: 'Aucun colis éligible trouvé'
};
```

## 🚀 Évolutions Futures

### Fonctionnalités Prévues
- **Sélection manuelle** des colis à traiter
- **Actions programmées** (traitement différé)
- **Historique des actions** en lot
- **Export des rapports** d'actions

### Améliorations Possibles
- **Undo/Redo** pour les actions critiques
- **Notifications push** pour les actions importantes
- **Audit trail** complet des modifications
- **Intégration avec système de notifications**

## 📞 Support et Dépannage

### Problèmes Courants

1. **Boutons non visibles**
   - Vérifier que la cargaison contient des colis
   - Vérifier les états des colis

2. **Actions qui échouent**
   - Vérifier la connectivité réseau
   - Consulter les logs du serveur
   - Vérifier les permissions

3. **Rechargement qui ne fonctionne pas**
   - Vérifier la fonction `getCurrentCargaisonId()`
   - Vérifier les délais de rechargement

### Logs de Debug

```javascript
// Activer les logs détaillés
window.DEBUG_BULK_ACTIONS = true;

// Les logs apparaîtront dans la console
console.log('🔄 Action en lot démarrée:', action, cargaisonId);
console.log('✅ Colis traités:', successCount);
console.log('❌ Erreurs:', errors);
```

---

**Note :** Cette fonctionnalité est maintenant pleinement intégrée dans votre système TransCargo et prête à être utilisée en production.