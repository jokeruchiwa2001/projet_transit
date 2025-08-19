<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuration de l'API json-server
define('JSON_SERVER_BASE', 'http://localhost:3006');

// Fonction pour faire des appels à json-server
function callJsonServer($endpoint) {
    $url = JSON_SERVER_BASE . $endpoint;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
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
    $cargaisons = callJsonServer('/cargaisons');
    $colis = callJsonServer('/colis');
    
    // Calculer les statistiques
    $stats = [
        'totalCargaisons' => count($cargaisons),
        'cargaisonsOuvertes' => count(array_filter($cargaisons, function($c) { 
            return $c['etatGlobal'] === 'OUVERT'; 
        })),
        'cargaisonsFermees' => count(array_filter($cargaisons, function($c) { 
            return $c['etatGlobal'] === 'FERME'; 
        })),
        'cargaisonsEnCours' => count(array_filter($cargaisons, function($c) { 
            return $c['etatAvancement'] === 'EN_COURS'; 
        })),
        'cargaisonsArrivees' => count(array_filter($cargaisons, function($c) { 
            return $c['etatAvancement'] === 'ARRIVE'; 
        })),
        'totalColis' => count($colis),
        'colisEnAttente' => count(array_filter($colis, function($c) { 
            return $c['etat'] === 'EN_ATTENTE'; 
        })),
        'colisEnCours' => count(array_filter($colis, function($c) { 
            return $c['etat'] === 'EN_COURS'; 
        })),
        'colisArrivees' => count(array_filter($colis, function($c) { 
            return $c['etat'] === 'ARRIVE'; 
        })),
        'colisRecuperes' => count(array_filter($colis, function($c) { 
            return $c['etat'] === 'RECUPERE'; 
        })),
        'colisPerdus' => count(array_filter($colis, function($c) { 
            return $c['etat'] === 'PERDU'; 
        })),
        'revenuTotal' => array_sum(array_map(function($c) { 
            return $c['prixFinal'] ?? 0; 
        }, $colis)),
        
        // Données pour les graphiques
        'transportMaritime' => count(array_filter($cargaisons, function($c) { 
            return $c['type'] === 'maritime'; 
        })),
        'transportAerien' => count(array_filter($cargaisons, function($c) { 
            return $c['type'] === 'aerienne'; 
        })),
        'transportRoutier' => count(array_filter($cargaisons, function($c) { 
            return $c['type'] === 'routiere'; 
        }))
    ];
    
    echo json_encode($stats);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
