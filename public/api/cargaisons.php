<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

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

// Récupérer les paramètres du routeur ou de l'URL
$cargaisonId = $_GET['cargaisonId'] ?? null;
$action = $_GET['action'] ?? null;

// Si pas de paramètres du routeur, parser l'URL directement
if (!$cargaisonId || !$action) {
    $requestUri = $_SERVER['REQUEST_URI'];
    $parsedUrl = parse_url($requestUri);
    $path = trim($parsedUrl['path'], '/');
    $pathParts = explode('/', $path);

    // Format attendu: api/cargaisons/{id}/{action}
    if (count($pathParts) >= 4 && $pathParts[0] === 'api' && $pathParts[1] === 'cargaisons') {
        $cargaisonId = $pathParts[2];
        $action = $pathParts[3] ?? null;
    }
}

if (!$cargaisonId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de cargaison manquant']);
    exit;
}

try {
    switch ($action) {
        case 'close':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Récupérer la cargaison
                $cargaison = callJsonServer("/cargaisons/$cargaisonId");
                
                if (!$cargaison) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Cargaison non trouvée']);
                    exit;
                }
                
                // Vérifier que la cargaison peut être fermée
                if ($cargaison['etatGlobal'] === 'FERME') {
                    http_response_code(400);
                    echo json_encode(['error' => 'Cette cargaison est déjà fermée']);
                    exit;
                }
                
                if ($cargaison['etatAvancement'] === 'EN_COURS') {
                    http_response_code(400);
                    echo json_encode(['error' => 'Impossible de fermer une cargaison en cours']);
                    exit;
                }
                
                // Fermer la cargaison
                $cargaison['etatGlobal'] = 'FERME';
                $updatedCargaison = callJsonServer("/cargaisons/$cargaisonId", 'PUT', $cargaison);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Cargaison fermée avec succès',
                    'cargaison' => $updatedCargaison
                ]);
            }
            break;
            
        case 'reopen':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Récupérer la cargaison
                $cargaison = callJsonServer("/cargaisons/$cargaisonId");
                
                if (!$cargaison) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Cargaison non trouvée']);
                    exit;
                }
                
                // Vérifier que la cargaison peut être rouverte
                if ($cargaison['etatAvancement'] !== 'EN_ATTENTE') {
                    http_response_code(400);
                    echo json_encode(['error' => 'Seules les cargaisons en attente peuvent être rouvertes']);
                    exit;
                }
                
                // Rouvrir la cargaison
                $cargaison['etatGlobal'] = 'OUVERT';
                $updatedCargaison = callJsonServer("/cargaisons/$cargaisonId", 'PUT', $cargaison);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Cargaison rouverte avec succès',
                    'cargaison' => $updatedCargaison
                ]);
            }
            break;
            
        case 'start':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Récupérer la cargaison
                $cargaison = callJsonServer("/cargaisons/$cargaisonId");
                
                if (!$cargaison) {
                    http_response_code(404);
                    echo json_encode([
                        'error' => 'Cargaison non trouvée',
                        'debug' => ['cargaisonId' => $cargaisonId]
                    ]);
                    exit;
                }
                
                // Récupérer les colis de cette cargaison
                $allColis = callJsonServer("/colis");
                $colisInCargaison = array_filter($allColis, function($colis) use ($cargaisonId) {
                    return $colis['cargaisonId'] === $cargaisonId;
                });
                
                // Debug : afficher l'état de la cargaison
                error_log("DEBUG - Cargaison $cargaisonId : état=" . $cargaison['etatGlobal'] . ", avancement=" . $cargaison['etatAvancement'] . ", colis=" . count($colisInCargaison));
                
                // Vérifications avec debug
                if (empty($colisInCargaison)) {
                    http_response_code(400);
                    echo json_encode([
                        'error' => 'Impossible de démarrer une cargaison vide. Ajoutez au moins un colis avant le départ.',
                        'debug' => [
                            'cargaisonId' => $cargaisonId,
                            'nombreColis' => count($colisInCargaison),
                            'totalColisDisponibles' => count($allColis)
                        ]
                    ]);
                    exit;
                }
                
                if ($cargaison['etatGlobal'] === 'OUVERT') {
                    http_response_code(400);
                    echo json_encode([
                        'error' => 'Impossible de démarrer une cargaison ouverte. Fermez-la d\'abord.',
                        'debug' => ['etatGlobal' => $cargaison['etatGlobal']]
                    ]);
                    exit;
                }
                
                if ($cargaison['etatAvancement'] === 'EN_COURS') {
                    http_response_code(400);
                    echo json_encode([
                        'error' => 'Cette cargaison est déjà en cours',
                        'debug' => ['etatAvancement' => $cargaison['etatAvancement']]
                    ]);
                    exit;
                }
                
                if ($cargaison['etatAvancement'] === 'ARRIVE') {
                    http_response_code(400);
                    echo json_encode([
                        'error' => 'Cette cargaison est déjà arrivée',
                        'debug' => ['etatAvancement' => $cargaison['etatAvancement']]
                    ]);
                    exit;
                }
                
                // Démarrer la cargaison
                $cargaison['etatAvancement'] = 'EN_COURS';
                $cargaison['dateDepart'] = date('c');
                $updatedCargaison = callJsonServer("/cargaisons/$cargaisonId", 'PUT', $cargaison);
                
                // Mettre à jour l'état de tous les colis
                foreach ($colisInCargaison as $colis) {
                    if ($colis['etat'] === 'EN_ATTENTE') {
                        $colis['etat'] = 'EN_COURS';
                        callJsonServer("/colis/{$colis['id']}", 'PUT', $colis);
                    }
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Cargaison démarrée avec succès',
                    'cargaison' => $updatedCargaison
                ]);
            }
            break;
            
        case 'arrive':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Récupérer la cargaison
                $cargaison = callJsonServer("/cargaisons/$cargaisonId");
                
                if (!$cargaison) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Cargaison non trouvée']);
                    exit;
                }
                
                // Vérifications - Permet de traiter les cargaisons EN_COURS ou déjà ARRIVÉ (pour corriger les colis)
                if (!in_array($cargaison['etatAvancement'], ['EN_COURS', 'ARRIVE'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Seules les cargaisons en cours ou arrivées peuvent être traitées']);
                    exit;
                }
                
                // Marquer comme arrivée
                $cargaison['etatAvancement'] = 'ARRIVE';
                $cargaison['dateArriveeReelle'] = date('c');
                $updatedCargaison = callJsonServer("/cargaisons/$cargaisonId", 'PUT', $cargaison);
                
                // Mettre à jour l'état de TOUS les colis non-arrivés
                // RÈGLE MÉTIER: Une cargaison arrivée = TOUS ses colis sont arrivés
                $allColis = callJsonServer("/colis");
                $colisUpdated = 0;
                $colisErrors = [];
                
                foreach ($allColis as $colis) {
                    if ($colis['cargaisonId'] === $cargaisonId) {
                        // Mettre à jour TOUS les colis qui ne sont pas encore récupérés, perdus ou archivés
                        if (!in_array($colis['etat'], ['RECUPERE', 'PERDU', 'ARCHIVE'])) {
                            try {
                                $oldState = $colis['etat'];
                                $colis['etat'] = 'ARRIVE';
                                $colis['dateArrivee'] = date('c');
                                callJsonServer("/colis/{$colis['id']}", 'PUT', $colis);
                                $colisUpdated++;
                                error_log("DEBUG - Colis {$colis['id']} mis à jour: $oldState → ARRIVE");
                            } catch (Exception $e) {
                                $colisErrors[] = ['id' => $colis['id'], 'error' => $e->getMessage()];
                                error_log("ERROR - Échec mise à jour colis {$colis['id']}: " . $e->getMessage());
                            }
                        }
                    }
                }
                
                // Log du résultat
                error_log("DEBUG - Cargaison $cargaisonId arrivée: $colisUpdated colis mis à jour, " . count($colisErrors) . " erreurs");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Cargaison marquée comme arrivée',
                    'cargaison' => $updatedCargaison
                ]);
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Action non trouvée']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
