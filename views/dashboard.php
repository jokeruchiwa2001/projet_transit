<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GP du Monde - Gestion de Cargaisons</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.28.0/feather.min.js"></script>
    <link rel="stylesheet" href="/assets/css/styles.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .nav-active { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        .status-badge { font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 600; }
        .status-attente { background: #fef3c7; color: #92400e; }
        .status-cours { background: #dbeafe; color: #1e40af; }
        .status-arrive { background: #d1fae5; color: #065f46; }
        .status-recupere { background: #f3e8ff; color: #7c2d12; }
        .status-perdu { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="gradient-bg shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <i data-feather="globe" class="text-purple-600 w-8 h-8"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">GP du Monde</h1>
                        <p class="text-purple-100 text-sm">Transport de colis mondial</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="hidden md:flex items-center space-x-2 text-white">
                        <i data-feather="user" class="w-5 h-5"></i>
                        <span>Gestionnaire</span>
                    </div>
                    <button class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
                        <i data-feather="log-out" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div class="flex min-h-screen">
        <!-- Sidebar -->
        <aside class="w-64 bg-white shadow-lg">
            <nav class="mt-6 px-6">
                <div class="space-y-2">
                    <a href="/dashboard" class="nav-item nav-active flex items-center px-4 py-3 rounded-lg">
                        <i data-feather="home" class="mr-3 w-5 h-5"></i>
                        Tableau de bord
                    </a>
                    <a href="/cargaisons" class="nav-item flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <i data-feather="package" class="mr-3 w-5 h-5"></i>
                        Cargaisons
                    </a>
                    <a href="#" class="nav-item flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <i data-feather="box" class="mr-3 w-5 h-5"></i>
                        Colis
                    </a>
                    <a href="/clients" class="nav-item flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <i data-feather="users" class="mr-3 w-5 h-5"></i>
                        Clients
                    </a>
                    <a href="/suivi" class="nav-item flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <i data-feather="search" class="mr-3 w-5 h-5"></i>
                        Suivi Colis
                    </a>
                </div>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-8">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-xl shadow-sm card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm font-medium">Cargaisons Actives</p>
                            <p class="text-3xl font-bold text-gray-900" id="stat-cargaisons">0</p>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-full">
                            <i data-feather="package" class="text-blue-600 w-6 h-6"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-xl shadow-sm card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm font-medium">Colis en Transit</p>
                            <p class="text-3xl font-bold text-gray-900" id="stat-colis">0</p>
                        </div>
                        <div class="bg-green-100 p-3 rounded-full">
                            <i data-feather="truck" class="text-green-600 w-6 h-6"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm font-medium">Clients Actifs</p>
                            <p class="text-3xl font-bold text-gray-900" id="stat-clients">0</p>
                        </div>
                        <div class="bg-purple-100 p-3 rounded-full">
                            <i data-feather="users" class="text-purple-600 w-6 h-6"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm font-medium">Revenus du Mois</p>
                            <p class="text-3xl font-bold text-gray-900" id="stat-revenus">0</p>
                            <p class="text-xs text-gray-500">FCFA</p>
                        </div>
                        <div class="bg-yellow-100 p-3 rounded-full">
                            <i data-feather="dollar-sign" class="text-yellow-600 w-6 h-6"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activities -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Activités Récentes</h3>
                <div id="recent-activities" class="space-y-4">
                    <!-- Les activités seront chargées dynamiquement -->
                </div>
            </div>
        </main>
    </div>

    <!-- Scripts -->
    <script src="/assets/js/app.js"></script>
    <script>
        // Initialize Feather Icons
        feather.replace();
        
        // Charger les statistiques au chargement de la page
        document.addEventListener('DOMContentLoaded', function() {
            loadDashboardStats();
            loadRecentActivities();
        });
    </script>
</body>
</html>
