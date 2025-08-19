async function showColisDetails(colis) {
    // Récupérer la cargaison liée
    const cargaison = await apiCall(`/cargaisons/${colis.cargaisonId}`);
    const actions = [];

    // Vérifier si la cargaison est arrivée et le colis est "ARRIVE"
    if (cargaison && cargaison.etatAvancement === 'ARRIVE' && colis.etat === 'ARRIVE') {
        actions.push(`
            <button class="btn btn-success" onclick="markColisRecupere('${colis.id}')">
                <i class="fas fa-check"></i> Marquer Récupéré
            </button>
            <button class="btn btn-danger" onclick="markColisPerdu('${colis.id}')">
                <i class="fas fa-times"></i> Marquer Perdu
            </button>
        `);
    }

    document.getElementById('resultat-colis').innerHTML = `
        <div class="colis-details-card">
            <!-- ...autres champs du colis... -->
            <div><strong>Code :</strong> ${colis.id}</div>
            <div><strong>Expéditeur :</strong> ...</div>
            <!-- ... -->
            <div id="colis-actions">${actions.join(' ')}</div>
        </div>
    `;
}

// Actions
async function markColisRecupere(colisId) {
    if (!confirm('Confirmer la récupération de ce colis ?')) return;
    await apiCall(`/colis/${colisId}/recupere`, { method: 'POST' });
    showNotification('Colis marqué comme récupéré', 'success');
    // Rafraîchir l’affichage
}

async function markColisPerdu(colisId) {
    if (!confirm('Confirmer la déclaration de perte de ce colis ?')) return;
    await apiCall(`/colis/${colisId}/perdu`, { method: 'POST' });
    showNotification('Colis marqué comme perdu', 'warning');
    // Rafraîchir l’affichage
}