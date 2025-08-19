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

// Parser l'URL pour déterminer l'action
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = trim($parsedUrl['path'], '/');
$pathParts = explode('/', $path);

// Extraire l'ID du colis et l'action
$colisId = null;
$action = null;

// Support pour les paramètres GET directs (ex: api/colis.php?action=search)
if (isset($_GET['action'])) {
    $action = $_GET['action'];
}

// Format URL rewrité: api/colis/{id}/{action} ou api/colis/{action}
if (count($pathParts) >= 4 && $pathParts[0] === 'api' && $pathParts[1] === 'colis') {
    $colisId = $pathParts[2];
    $action = $pathParts[3] ?? $action;
} elseif (count($pathParts) >= 3 && $pathParts[0] === 'api' && $pathParts[1] === 'colis') {
    $action = $pathParts[2] ?? $action;
}

// Log pour debug
error_log("DEBUG - Colis API: path=$path, action=$action, colisId=$colisId");

if (!$colisId && !in_array($action, ['search', 'track'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de colis manquant', 'debug' => ['path' => $path, 'action' => $action]]);
    exit;
}

try {
    switch ($action) {
        case 'recupere':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Récupérer le colis
                $colis = callJsonServer("/colis/$colisId");
                
                if (!$colis) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Colis non trouvé']);
                    exit;
                }
                
                // Vérifier que le colis peut être récupéré
                if ($colis['etat'] !== 'ARRIVE') {
                    http_response_code(400);
                    echo json_encode(['error' => 'Le colis doit être arrivé avant d\'être récupéré']);
                    exit;
                }
                
                // Marquer comme récupéré
                $colis['etat'] = 'RECUPERE';
                $colis['dateRecuperation'] = date('c');
                $updatedColis = callJsonServer("/colis/$colisId", 'PUT', $colis);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Colis marqué comme récupéré',
                    'colis' => $updatedColis
                ]);
            }
            break;
            
        case 'perdu':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Récupérer le colis
                $colis = callJsonServer("/colis/$colisId");
                
                if (!$colis) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Colis non trouvé']);
                    exit;
                }
                
                // NOUVELLE RÈGLE : Le colis doit être arrivé pour pouvoir être marqué perdu
                if ($colis['etat'] !== 'ARRIVE') {
                    http_response_code(400);
                    echo json_encode(['error' => 'Le colis doit être arrivé avant d\'être marqué comme perdu']);
                    exit;
                }
                
                // Marquer comme perdu
                $colis['etat'] = 'PERDU';
                $colis['datePerdu'] = date('c');
                $updatedColis = callJsonServer("/colis/$colisId", 'PUT', $colis);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Colis marqué comme perdu',
                    'colis' => $updatedColis
                ]);
            }
            break;
            
        case 'recu':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Récupérer le colis
                $colis = callJsonServer("/colis/$colisId");
                
                if (!$colis) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Colis non trouvé']);
                    exit;
                }
                
                // Générer le reçu
                $recu = "
=== REÇU D'EXPÉDITION ===
Code colis: {$colis['id']}
Code destinataire: {$colis['codeDestinataire']}

EXPÉDITEUR:
{$colis['expediteur']['prenom']} {$colis['expediteur']['nom']}
{$colis['expediteur']['adresse']}
Tél: {$colis['expediteur']['telephone']}
" . (isset($colis['expediteur']['email']) ? "Email: {$colis['expediteur']['email']}" : '') . "

DESTINATAIRE:
{$colis['destinataire']['nomComplet']}
{$colis['destinataire']['adresse']}
Tél: {$colis['destinataire']['telephone']}

DÉTAILS DU COLIS:
Nombre de colis: {$colis['nombreColis']}
Poids total: {$colis['poids']} kg
Type de produit: {$colis['typeProduit']}
Type de transport: {$colis['typeCargaison']}

TARIFICATION:
Prix calculé: " . number_format($colis['prixCalcule']) . " FCFA
Prix final: " . number_format($colis['prixFinal']) . " FCFA

Date d'expédition: " . date('d/m/Y', strtotime($colis['dateCreation'])) . "
=========================";
                
                echo json_encode(['recu' => $recu]);
            }
            break;
            
        case 'search':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $code = $_GET['code'] ?? '';
                if (!$code) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Code requis']);
                    exit;
                }
                
                // Rechercher le colis par ID ou code destinataire
                $allColis = callJsonServer('/colis');
                $colis = null;
                
                foreach ($allColis as $c) {
                    if ($c['id'] === $code || $c['codeDestinataire'] === $code) {
                        $colis = $c;
                        break;
                    }
                }
                
                echo json_encode($colis);
            }
            break;
            
        case 'track':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $code = $_GET['code'] ?? '';
                if (!$code) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Code requis']);
                    exit;
                }
                
                // Rechercher le colis
                $allColis = callJsonServer('/colis');
                $colis = null;
                
                foreach ($allColis as $c) {
                    if ($c['id'] === $code || $c['codeDestinataire'] === $code) {
                        $colis = $c;
                        break;
                    }
                }
                
                if (!$colis) {
                    echo json_encode([
                        'statut' => 'NOT_FOUND',
                        'message' => 'Code de colis non trouvé',
                        'colis' => null,
                        'cargaison' => null
                    ]);
                    exit;
                }
                
                // Récupérer la cargaison associée
                $cargaison = null;
                if ($colis['cargaisonId']) {
                    try {
                        $cargaison = callJsonServer("/cargaisons/{$colis['cargaisonId']}");
                    } catch (Exception $e) {
                        // Ignorer si la cargaison n'existe pas
                    }
                }
                
                // Messages selon l'état
                $messages = [
                    'EN_ATTENTE' => 'Votre colis est en attente de départ',
                    'EN_COURS' => 'Votre colis est en cours de transport',
                    'ARRIVE' => 'Votre colis est arrivé et peut être récupéré',
                    'RECUPERE' => 'Votre colis a été récupéré',
                    'PERDU' => 'Votre colis est malheureusement perdu'
                ];
                
                $message = $messages[$colis['etat']] ?? 'État inconnu';
                
                echo json_encode([
                    'statut' => $colis['etat'],
                    'message' => $message,
                    'colis' => $colis,
                    'cargaison' => $cargaison
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
