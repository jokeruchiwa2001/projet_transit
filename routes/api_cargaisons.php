<?php

function createCargaison() {
    header('Content-Type: application/json');
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
        return;
    }
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validation des données
        if (!isset($input['type']) || !isset($input['distance'])) {
            throw new Exception('Données manquantes');
        }
        
        $type = $input['type'];
        $distance = (int)$input['distance'];
        $depart = $input['depart'] ?? '';
        $arrivee = $input['arrivee'] ?? '';
        
        // Validation du type
        $typesValides = ['maritime', 'aerienne', 'routiere'];
        if (!in_array($type, $typesValides)) {
            throw new Exception('Type de cargaison invalide');
        }
        
        if ($distance <= 0) {
            throw new Exception('La distance doit être positive');
        }
        
        // Générer un ID unique
        $id = strtoupper($type) . '-' . date('Y') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
        
        // Appel à Node.js pour créer la cargaison avec les classes TypeScript
        $nodeCommand = sprintf(
            'node %s/api/create_cargaison.js %s %s %d',
            ROOT_PATH,
            escapeshellarg($id),
            escapeshellarg($type),
            $distance
        );
        
        $result = shell_exec($nodeCommand);
        $cargaisonData = json_decode($result, true);
        
        if (!$cargaisonData || isset($cargaisonData['error'])) {
            throw new Exception($cargaisonData['error'] ?? 'Erreur lors de la création');
        }
        
        // Ajouter les informations supplémentaires
        $cargaisonData['depart'] = $depart;
        $cargaisonData['arrivee'] = $arrivee;
        $cargaisonData['status'] = 'attente';
        $cargaisonData['dateCreation'] = date('Y-m-d H:i:s');
        
        // Sauvegarder dans un fichier JSON (simulation base de données)
        saveCargaison($cargaisonData);
        
        echo json_encode([
            'success' => true,
            'cargaison' => $cargaisonData,
            'message' => 'Cargaison créée avec succès'
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

function listCargaisons() {
    header('Content-Type: application/json');
    
    try {
        $cargaisons = loadCargaisons();
        
        // Filtrage si des paramètres sont passés
        $type = $_GET['type'] ?? '';
        $status = $_GET['status'] ?? '';
        $search = $_GET['search'] ?? '';
        
        if ($type) {
            $cargaisons = array_filter($cargaisons, function($c) use ($type) {
                return $c['type'] === $type;
            });
        }
        
        if ($status) {
            $cargaisons = array_filter($cargaisons, function($c) use ($status) {
                return $c['status'] === $status;
            });
        }
        
        if ($search) {
            $cargaisons = array_filter($cargaisons, function($c) use ($search) {
                return stripos($c['id'], $search) !== false;
            });
        }
        
        echo json_encode([
            'success' => true,
            'cargaisons' => array_values($cargaisons)
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

function addProduitToCargaison() {
    header('Content-Type: application/json');
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $cargaisonId = $input['cargaisonId'];
        $produitData = $input['produit'];
        
        // Appel à Node.js pour ajouter le produit
        $nodeCommand = sprintf(
            'node %s/api/add_produit.js %s %s',
            ROOT_PATH,
            escapeshellarg($cargaisonId),
            escapeshellarg(json_encode($produitData))
        );
        
        $result = shell_exec($nodeCommand);
        $response = json_decode($result, true);
        
        if ($response['success']) {
            // Mettre à jour la cargaison sauvegardée
            updateCargaison($cargaisonId, $response['cargaison']);
        }
        
        echo json_encode($response);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

// Fonctions utilitaires pour la persistence
function saveCargaison($cargaison) {
    $dataFile = ROOT_PATH . '/data/cargaisons.json';
    $dataDir = dirname($dataFile);
    
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0777, true);
    }
    
    $cargaisons = loadCargaisons();
    $cargaisons[] = $cargaison;
    
    file_put_contents($dataFile, json_encode($cargaisons, JSON_PRETTY_PRINT));
}

function loadCargaisons() {
    $dataFile = ROOT_PATH . '/data/cargaisons.json';
    
    if (!file_exists($dataFile)) {
        return [];
    }
    
    $content = file_get_contents($dataFile);
    return json_decode($content, true) ?: [];
}

function updateCargaison($id, $updatedData) {
    $cargaisons = loadCargaisons();
    
    foreach ($cargaisons as &$cargaison) {
        if ($cargaison['id'] === $id) {
            $cargaison = array_merge($cargaison, $updatedData);
            break;
        }
    }
    
    $dataFile = ROOT_PATH . '/data/cargaisons.json';
    file_put_contents($dataFile, json_encode($cargaisons, JSON_PRETTY_PRINT));
}

?>
