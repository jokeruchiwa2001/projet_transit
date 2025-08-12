<?php

/**
 * Routes API pour les Actions en Lot sur les Colis - TransCargo
 * Intégration avec le système Node.js existant
 */

// Inclure les fonctions utilitaires si elles existent
if (file_exists(ROOT_PATH . '/routes/api_cargaisons.php')) {
    require_once ROOT_PATH . '/routes/api_cargaisons.php';
}

/**
 * Marquer un colis comme récupéré
 */
function markColisRecupere() {
    header('Content-Type: application/json');
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
        return;
    }
    
    try {
        // Récupérer l'ID du colis depuis l'URL
        $colisId = $_GET['id'] ?? null;
        
        if (!$colisId) {
            throw new Exception('ID du colis manquant');
        }
        
        // Appeler le script Node.js pour la logique métier
        $nodeCommand = sprintf(
            'node %s/api/colis_bulk_actions.js markRecupere %s',
            ROOT_PATH,
            escapeshellarg($colisId)
        );
        
        $result = shell_exec($nodeCommand);
        $response = json_decode($result, true);
        
        if (!$response || !$response['success']) {
            throw new Exception($response['error'] ?? 'Erreur lors de la mise à jour');
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Colis marqué comme récupéré',
            'colis' => $response['colis'] ?? null
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Marquer un colis comme perdu
 */
function markColisPerdu() {
    header('Content-Type: application/json');
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
        return;
    }
    
    try {
        // Récupérer l'ID du colis depuis l'URL
        $colisId = $_GET['id'] ?? null;
        
        if (!$colisId) {
            throw new Exception('ID du colis manquant');
        }
        
        // Appeler le script Node.js pour la logique métier
        $nodeCommand = sprintf(
            'node %s/api/colis_bulk_actions.js markPerdu %s',
            ROOT_PATH,
            escapeshellarg($colisId)
        );
        
        $result = shell_exec($nodeCommand);
        $response = json_decode($result, true);
        
        if (!$response || !$response['success']) {
            throw new Exception($response['error'] ?? 'Erreur lors de la mise à jour');
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Colis marqué comme perdu',
            'colis' => $response['colis'] ?? null
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Obtenir les colis d'une cargaison
 */
function getColisByCargaison() {
    header('Content-Type: application/json');
    
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
        return;
    }
    
    try {
        // Récupérer l'ID de la cargaison depuis l'URL
        $cargaisonId = $_GET['cargaisonId'] ?? null;
        
        if (!$cargaisonId) {
            throw new Exception('ID de la cargaison manquant');
        }
        
        // Charger les colis depuis le fichier JSON
        $colisFile = ROOT_PATH . '/data/colis.json';
        
        if (!file_exists($colisFile)) {
            echo json_encode([]);
            return;
        }
        
        $colisData = file_get_contents($colisFile);
        $allColis = json_decode($colisData, true);
        
        if (!$allColis) {
            echo json_encode([]);
            return;
        }
        
        // Filtrer les colis de cette cargaison
        $cargaisonColis = array_filter($allColis, function($colis) use ($cargaisonId) {
            return $colis['cargaisonId'] === $cargaisonId;
        });
        
        // Réindexer le tableau
        $cargaisonColis = array_values($cargaisonColis);
        
        echo json_encode($cargaisonColis);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Actions en lot sur les colis
 */
function bulkActionColis() {
    header('Content-Type: application/json');
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
        return;
    }
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $cargaisonId = $input['cargaisonId'] ?? null;
        $action = $input['action'] ?? null;
        $colisIds = $input['colisIds'] ?? null;
        
        if (!$cargaisonId || !$action) {
            throw new Exception('Paramètres manquants (cargaisonId, action)');
        }
        
        $validActions = ['RECUPERE', 'PERDU'];
        if (!in_array($action, $validActions)) {
            throw new Exception('Action non valide');
        }
        
        // Charger les colis
        $colisFile = ROOT_PATH . '/data/colis.json';
        
        if (!file_exists($colisFile)) {
            throw new Exception('Fichier des colis non trouvé');
        }
        
        $colisData = file_get_contents($colisFile);
        $allColis = json_decode($colisData, true);
        
        if (!$allColis) {
            throw new Exception('Erreur lors du chargement des colis');
        }
        
        $updatedCount = 0;
        $errors = [];
        
        // Traiter chaque colis
        foreach ($allColis as &$colis) {
            // Vérifier si ce colis appartient à la cargaison
            if ($colis['cargaisonId'] !== $cargaisonId) {
                continue;
            }
            
            // Si des IDs spécifiques sont fournis, les vérifier
            if ($colisIds && !in_array($colis['id'], $colisIds)) {
                continue;
            }
            
            // Vérifier les conditions selon l'action
            $canUpdate = false;
            
            if ($action === 'RECUPERE' && $colis['etat'] === 'ARRIVE') {
                $canUpdate = true;
            } elseif ($action === 'PERDU' && in_array($colis['etat'], ['EN_COURS', 'ARRIVE'])) {
                $canUpdate = true;
            }
            
            if ($canUpdate) {
                $colis['etat'] = $action;
                $dateField = $action === 'RECUPERE' ? 'dateRecuperation' : 'datePerdu';
                $colis[$dateField] = date('c'); // Format ISO 8601
                $updatedCount++;
            } else {
                $errors[] = "Colis {$colis['id']}: état {$colis['etat']} non compatible avec l'action {$action}";
            }
        }
        
        // Sauvegarder les modifications
        $saved = file_put_contents($colisFile, json_encode($allColis, JSON_PRETTY_PRINT));
        
        if ($saved === false) {
            throw new Exception('Erreur lors de la sauvegarde');
        }
        
        echo json_encode([
            'success' => true,
            'message' => "{$updatedCount} colis mis à jour",
            'updatedCount' => $updatedCount,
            'errors' => $errors,
            'action' => $action
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Obtenir les statistiques des colis d'une cargaison
 */
function getCargaisonColisStats() {
    header('Content-Type: application/json');
    
    try {
        $cargaisonId = $_GET['cargaisonId'] ?? null;
        
        if (!$cargaisonId) {
            throw new Exception('ID de la cargaison manquant');
        }
        
        // Charger les colis
        $colisFile = ROOT_PATH . '/data/colis.json';
        
        if (!file_exists($colisFile)) {
            echo json_encode([
                'success' => true,
                'stats' => [
                    'total' => 0,
                    'enAttente' => 0,
                    'enCours' => 0,
                    'arrives' => 0,
                    'recuperes' => 0,
                    'perdus' => 0,
                    'eligiblesPourRecuperation' => 0,
                    'eligiblesPourPerdu' => 0
                ]
            ]);
            return;
        }
        
        $colisData = file_get_contents($colisFile);
        $allColis = json_decode($colisData, true);
        
        if (!$allColis) {
            throw new Exception('Erreur lors du chargement des colis');
        }
        
        // Filtrer les colis de cette cargaison
        $cargaisonColis = array_filter($allColis, function($colis) use ($cargaisonId) {
            return $colis['cargaisonId'] === $cargaisonId;
        });
        
        // Calculer les statistiques
        $stats = [
            'total' => count($cargaisonColis),
            'enAttente' => 0,
            'enCours' => 0,
            'arrives' => 0,
            'recuperes' => 0,
            'perdus' => 0,
            'eligiblesPourRecuperation' => 0,
            'eligiblesPourPerdu' => 0
        ];
        
        foreach ($cargaisonColis as $colis) {
            $etat = $colis['etat'];
            
            switch ($etat) {
                case 'EN_ATTENTE':
                    $stats['enAttente']++;
                    break;
                case 'EN_COURS':
                    $stats['enCours']++;
                    $stats['eligiblesPourPerdu']++;
                    break;
                case 'ARRIVE':
                    $stats['arrives']++;
                    $stats['eligiblesPourRecuperation']++;
                    $stats['eligiblesPourPerdu']++;
                    break;
                case 'RECUPERE':
                    $stats['recuperes']++;
                    break;
                case 'PERDU':
                    $stats['perdus']++;
                    break;
            }
        }
        
        echo json_encode([
            'success' => true,
            'stats' => $stats,
            'cargaisonId' => $cargaisonId
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Routeur principal pour les actions en lot sur les colis
 */
function handleColisBulkRequest() {
    $requestUri = $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Nettoyer l'URI
    $path = parse_url($requestUri, PHP_URL_PATH);
    $path = rtrim($path, '/');
    
    // Router les requêtes
    if (preg_match('/\/api\/colis\/([^\/]+)\/recupere$/', $path, $matches)) {
        $_GET['id'] = $matches[1];
        markColisRecupere();
    } elseif (preg_match('/\/api\/colis\/([^\/]+)\/perdu$/', $path, $matches)) {
        $_GET['id'] = $matches[1];
        markColisPerdu();
    } elseif (preg_match('/\/api\/cargaisons\/([^\/]+)\/colis$/', $path, $matches)) {
        $_GET['cargaisonId'] = $matches[1];
        getColisByCargaison();
    } elseif (preg_match('/\/api\/cargaisons\/([^\/]+)\/colis\/stats$/', $path, $matches)) {
        $_GET['cargaisonId'] = $matches[1];
        getCargaisonColisStats();
    } elseif ($path === '/api/colis/bulk' && $method === 'POST') {
        bulkActionColis();
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Endpoint non trouvé'
        ]);
    }
}

// Si ce fichier est appelé directement, traiter la requête
if (basename($_SERVER['SCRIPT_NAME']) === basename(__FILE__)) {
    handleColisBulkRequest();
}

?>