<?php
session_start();

// Configuration
define('ROOT_PATH', dirname(__DIR__));
define('PUBLIC_PATH', __DIR__);
define('VIEWS_PATH', ROOT_PATH . '/views');
define('ROUTES_PATH', ROOT_PATH . '/routes');

// Auto-chargement des classes PHP
spl_autoload_register(function ($class) {
    $file = ROOT_PATH . '/routes/' . $class . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Routeur simple
class Router {
    private $routes = [];
    
    public function get($path, $callback) {
        $this->routes['GET'][$path] = $callback;
    }
    
    public function post($path, $callback) {
        $this->routes['POST'][$path] = $callback;
    }
    
    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Supprimer le chemin de base si nécessaire
        $basePath = dirname($_SERVER['SCRIPT_NAME']);
        if ($basePath !== '/') {
            $path = substr($path, strlen($basePath));
        }
        
        if (empty($path)) {
            $path = '/';
        }
        
        if (isset($this->routes[$method][$path])) {
            $callback = $this->routes[$method][$path];
            if (is_callable($callback)) {
                call_user_func($callback);
            } else {
                $this->loadView($callback);
            }
        } else {
            $this->notFound();
        }
    }
    
    private function loadView($view) {
        $viewFile = VIEWS_PATH . '/' . $view . '.php';
        if (file_exists($viewFile)) {
            require_once $viewFile;
        } else {
            $this->notFound();
        }
    }
    
    private function notFound() {
        http_response_code(404);
        echo '<h1>404 - Page non trouvée</h1>';
    }
}

// Fonction helper pour charger une vue
function loadView($view, $data = []) {
    extract($data);
    $viewFile = VIEWS_PATH . '/' . $view . '.php';
    if (file_exists($viewFile)) {
        require_once $viewFile;
    }
}

// Fonction helper pour rediriger
function redirect($path) {
    header('Location: ' . $path);
    exit;
}

// Fonction helper pour retourner du JSON
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Initialisation du routeur
$router = new Router();

// Routes principales
$router->get('/', 'dashboard');
$router->get('/dashboard', 'dashboard');
$router->get('/cargaisons', 'cargaisons');
$router->get('/clients', 'clients');
$router->get('/suivi', 'suivi');

// Routes API
$router->post('/api/cargaisons/create', function() {
    require_once ROUTES_PATH . '/api_cargaisons.php';
    createCargaison();
});

$router->post('/api/clients/create', function() {
    require_once ROUTES_PATH . '/api_clients.php';
    createClient();
});

$router->get('/api/cargaisons/list', function() {
    require_once ROUTES_PATH . '/api_cargaisons.php';
    listCargaisons();
});

$router->post('/api/suivi/search', function() {
    require_once ROUTES_PATH . '/api_suivi.php';
    searchColis();
});

// Lancement du routeur
$router->dispatch();
?>
