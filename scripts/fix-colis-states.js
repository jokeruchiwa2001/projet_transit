#!/usr/bin/env node
/**
 * Script de correction automatique des états des colis
 * Vérifie et corrige les colis qui ne sont pas synchronisés avec leur cargaison
 */

const https = require('http');
const fs = require('fs');
const path = require('path');

const JSON_SERVER_BASE = 'http://localhost:3006';

async function callJsonServer(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = `${JSON_SERVER_BASE}${endpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result);
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);

        if (data && method !== 'GET') {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function fixColisStates() {
    console.log('🔄 Vérification des états des colis...\n');

    try {
        // Récupérer toutes les cargaisons et tous les colis
        const cargaisons = await callJsonServer('/cargaisons');
        const colis = await callJsonServer('/colis');

        let corrections = 0;

        for (const cargaison of cargaisons) {
            console.log(`📦 Cargaison ${cargaison.numero} - État: ${cargaison.etatAvancement}`);
            
            // Trouver les colis de cette cargaison
            const colisInCargaison = colis.filter(c => c.cargaisonId === cargaison.id);
            
            if (colisInCargaison.length === 0) {
                console.log('   ⚠️  Aucun colis associé');
                continue;
            }

            for (const colisItem of colisInCargaison) {
                let needUpdate = false;
                let newState = colisItem.etat;
                let dateArrivee = colisItem.dateArrivee;

                // Règles de synchronisation
                if (cargaison.etatAvancement === 'EN_COURS' && colisItem.etat === 'EN_ATTENTE') {
                    needUpdate = true;
                    newState = 'EN_COURS';
                    console.log(`   🔧 Colis ${colisItem.id}: EN_ATTENTE → EN_COURS`);
                }

                if (cargaison.etatAvancement === 'ARRIVE' && colisItem.etat === 'EN_COURS') {
                    needUpdate = true;
                    newState = 'ARRIVE';
                    dateArrivee = cargaison.dateArriveeReelle || new Date().toISOString();
                    console.log(`   🔧 Colis ${colisItem.id}: EN_COURS → ARRIVE`);
                }

                // Appliquer la correction si nécessaire
                if (needUpdate) {
                    const updatedColis = {
                        ...colisItem,
                        etat: newState,
                        dateArrivee: dateArrivee
                    };

                    await callJsonServer(`/colis/${colisItem.id}`, 'PUT', updatedColis);
                    corrections++;
                    console.log(`   ✅ Colis ${colisItem.id} corrigé`);
                } else {
                    console.log(`   ✓  Colis ${colisItem.id} - État correct: ${colisItem.etat}`);
                }
            }

            console.log('');
        }

        console.log(`\n🎉 Vérification terminée - ${corrections} correction(s) appliquée(s)`);

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
        process.exit(1);
    }
}

// Exécuter le script si appelé directement
if (require.main === module) {
    fixColisStates();
}

module.exports = { fixColisStates };
