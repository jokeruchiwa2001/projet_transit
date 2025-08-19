#!/bin/bash

echo "🔧 Correction définitive - UNIQUEMENT via JSON Server db.json..."
echo ""

echo "🔍 Recherche automatique de tous les colis problématiques..."
echo ""

# Récupérer toutes les cargaisons ARRIVÉ avec leurs colis EN_COURS
colis_problematiques=$(curl -s http://localhost:3006/colis | jq -r '.[] | select(.etat == "EN_COURS") | .id + ":" + .cargaisonId')

corrections=0
problemes=0

for colis_info in $colis_problematiques; do
    if [ -z "$colis_info" ]; then
        continue
    fi
    
    colis_id=$(echo "$colis_info" | cut -d: -f1)
    cargaison_id=$(echo "$colis_info" | cut -d: -f2)
    
    # Vérifier si la cargaison est ARRIVÉ
    cargaison_etat=$(curl -s http://localhost:3006/cargaisons/$cargaison_id | jq -r '.etatAvancement')
    
    if [ "$cargaison_etat" = "ARRIVE" ]; then
        echo "❌ Problème détecté: Colis $colis_id (cargaison $cargaison_id)"
        problemes=$((problemes + 1))
        
        # Récupérer le colis et le mettre à jour
        colis_data=$(curl -s http://localhost:3006/colis/$colis_id)
        
        if [ "$colis_data" != "null" ] && [ -n "$colis_data" ]; then
            # Mettre à jour le colis
            updated_colis=$(echo "$colis_data" | jq '.etat = "ARRIVE" | .dateArrivee = "'$(date -Iseconds)'"')
            
            # PUT vers JSON Server
            result=$(curl -s -X PUT http://localhost:3006/colis/$colis_id \
                         -H "Content-Type: application/json" \
                         -d "$updated_colis")
            
            if [ $? -eq 0 ]; then
                echo "  ✅ $colis_id: EN_COURS → ARRIVE"
                corrections=$((corrections + 1))
            else
                echo "  ❌ $colis_id: Échec de la mise à jour"
            fi
        else
            echo "  ❌ $colis_id: Données non récupérées"
        fi
        echo ""
    fi
done

if [ $problemes -eq 0 ]; then
    echo "✅ Aucun problème détecté ! Tous les colis sont cohérents."
else
    echo "🎉 Correction terminée !"
    echo "   Problèmes détectés: $problemes"
    echo "   Corrections réussies: $corrections"
    echo ""
    if [ $corrections -eq $problemes ]; then
        echo "✅ Tous les problèmes ont été corrigés !"
    else
        echo "⚠️  $((problemes - corrections)) colis n'ont pas pu être corrigés."
    fi
fi

echo ""
echo "💡 N'oubliez pas de vider le cache de votre navigateur (Ctrl+Shift+R)"
echo ""
