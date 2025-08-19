#!/bin/bash

echo "🔧 Correction définitive des colis EN_COURS avec curl..."
echo ""

# Fonction pour mettre à jour un colis
fix_colis() {
    local colis_id=$1
    local cargaison_id=$2
    
    echo "  Correction du colis $colis_id..."
    
    # Récupérer le colis actuel
    colis_data=$(curl -s http://localhost:3006/colis/$colis_id)
    
    if [ $? -eq 0 ] && [ "$colis_data" != "null" ]; then
        # Modifier le colis pour le passer à ARRIVE
        updated_colis=$(echo "$colis_data" | jq '.etat = "ARRIVE" | .dateArrivee = "'$(date -Iseconds)'"')
        
        # Mettre à jour via PUT
        result=$(curl -s -X PUT http://localhost:3006/colis/$colis_id \
                     -H "Content-Type: application/json" \
                     -d "$updated_colis")
        
        if [ $? -eq 0 ]; then
            echo "    ✅ $colis_id: EN_COURS → ARRIVE"
        else
            echo "    ❌ $colis_id: Échec de la mise à jour"
        fi
    else
        echo "    ❌ $colis_id: Colis non trouvé"
    fi
}

echo "🔍 Recherche des colis à corriger..."

# Colis de test connus qui ont des problèmes
fix_colis "COL-TEST1" "CG-TEST12345"
fix_colis "COL-TEST2" "CG-TEST12345"

# Chercher d'autres colis EN_COURS avec des cargaisons ARRIVÉ
colis_list=$(curl -s http://localhost:3006/colis)
cargaisons_list=$(curl -s http://localhost:3006/cargaisons)

if command -v jq >/dev/null 2>&1; then
    echo ""
    echo "🔍 Recherche automatique d'autres problèmes..."
    
    # Extraire les colis EN_COURS
    colis_en_cours=$(echo "$colis_list" | jq -r '.[] | select(.etat == "EN_COURS") | .id + ":" + .cargaisonId')
    
    for colis_info in $colis_en_cours; do
        colis_id=$(echo "$colis_info" | cut -d: -f1)
        cargaison_id=$(echo "$colis_info" | cut -d: -f2)
        
        # Vérifier si la cargaison est ARRIVÉ
        cargaison_etat=$(echo "$cargaisons_list" | jq -r ".[] | select(.id == \"$cargaison_id\") | .etatAvancement")
        
        if [ "$cargaison_etat" = "ARRIVE" ]; then
            echo "  Problème détecté: $colis_id (cargaison $cargaison_id)"
            fix_colis "$colis_id" "$cargaison_id"
        fi
    done
else
    echo "  (jq non disponible, correction manuelle uniquement)"
fi

echo ""
echo "🎉 Correction terminée !"
echo "   Rafraîchissez votre interface avec Ctrl+Shift+R"
echo ""
