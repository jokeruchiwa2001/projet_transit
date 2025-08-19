<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration de l'API json-server
define('JSON_SERVER_BASE', 'http://localhost:3006');

// Fonction pour faire des appels à json-server
function callJsonServer($endpoint, $method = 'GET', $data = null) {
    $url = JSON_SERVER_BASE . $endpoint;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false || $httpCode >= 400) {
        throw new Exception("Erreur API: " . ($response ?: "Erreur de connexion"));
    }
    
    return json_decode($response, true);
}

try {
    // Récupérer toutes les cargaisons et tous les colis
    $cargaisons = callJsonServer("/cargaisons");
    $colis = callJsonServer("/colis");
    
    $corrections = [];
    $errors = [];
    
    foreach ($cargaisons as $cargaison) {
        // Trouver les colis de cette cargaison
        $colisInCargaison = array_filter($colis, function($c) use ($cargaison) {
            return $c['cargaisonId'] === $cargaison['id'];
        });
        
        foreach ($colisInCargaison as $colisItem) {
            $needUpdate = false;
            $newState = $colisItem['etat'];
            $dateArrivee = $colisItem['dateArrivee'] ?? null;
            
            // Règles de synchronisation
            if ($cargaison['etatAvancement'] === 'EN_COURS' && $colisItem['etat'] === 'EN_ATTENTE') {
                $needUpdate = true;
                $newState = 'EN_COURS';
            }
            
            // RÈGLE MÉTIER RENFORCÉE: Cargaison arrivée = TOUS les colis arrivés
            if ($cargaison['etatAvancement'] === 'ARRIVE' && 
                !in_array($colisItem['etat'], ['ARRIVE', 'RECUPERE', 'PERDU', 'ARCHIVE'])) {
                $needUpdate = true;
                $newState = 'ARRIVE';
                $dateArrivee = $cargaison['dateArriveeReelle'] ?? date('c');
            }
            
            // Appliquer la correction si nécessaire
            if ($needUpdate) {
                try {
                    $updatedColis = $colisItem;
                    $updatedColis['etat'] = $newState;
                    if ($dateArrivee) {
                        $updatedColis['dateArrivee'] = $dateArrivee;
                    }
                    
                    callJsonServer("/colis/{$colisItem['id']}", 'PUT', $updatedColis);
                    
                    $corrections[] = [
                        'colisId' => $colisItem['id'],
                        'cargaisonId' => $cargaison['id'],
                        'from' => $colisItem['etat'],
                        'to' => $newState,
                        'message' => "Colis {$colisItem['id']} corrigé: {$colisItem['etat']} → $newState"
                    ];
                    
                } catch (Exception $e) {
                    $errors[] = [
                        'colisId' => $colisItem['id'],
                        'error' => $e->getMessage()
                    ];
                }
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Vérification terminée',
        'corrections' => $corrections,
        'errors' => $errors,
        'stats' => [
            'totalCargaisons' => count($cargaisons),
            'totalColis' => count($colis),
            'corrections' => count($corrections),
            'errors' => count($errors)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
