<?php
// Routeur simple pour le serveur PHP intégré

$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = trim($parsedUrl['path'], '/');

// Routage des APIs
if (preg_match('#^api/cargaisons/([^/]+)/(close|reopen|start|arrive)/?$#', $path, $matches)) {
    $_GET['cargaisonId'] = $matches[1];
    $_GET['action'] = $matches[2];
    include 'api/cargaisons.php';
    return true;
} elseif (preg_match('#^api/colis/([^/]+)/(recupere|perdu|recu)/?$#', $path, $matches)) {
    $_GET['colisId'] = $matches[1];
    $_GET['action'] = $matches[2];
    include 'api/colis.php';
    return true;
} elseif (preg_match('#^api/colis/(search|track)/?$#', $path, $matches)) {
    $_GET['action'] = $matches[1];
    include 'api/colis.php';
    return true;
} elseif (preg_match('#^api/statistiques/?$#', $path)) {
    include 'api/statistiques.php';
    return true;
}

// Servir les fichiers statiques normalement
return false;
?>
