<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cargaisons - GP du Monde</title>
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
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <?php include VIEWS_PATH . '/includes/header.php'; ?>

    <div class="flex min-h-screen">
        <!-- Sidebar -->
        <?php include VIEWS_PATH . '/includes/sidebar.php'; ?>

        <!-- Main Content -->
        <main class="flex-1 p-8">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Gestion des Cargaisons</h2>
                <button id="btn-nouvelle-cargaison" class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-semibold">
                    <i data-feather="plus" class="inline-block w-5 h-5 mr-2"></i>
                    Nouvelle Cargaison
                </button>
            </div>

            <!-- Filters -->
            <div class="bg-white p-4 rounded-xl shadow-sm mb-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select id="filter-type" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option value="">Tous les types</option>
                        <option value="maritime">Maritime</option>
                        <option value="aerienne">Aérienne</option>
                        <option value="routiere">Routière</option>
                    </select>
                    <select id="filter-status" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option value="">Tous les états</option>
                        <option value="attente">En attente</option>
                        <option value="cours">En cours</option>
                        <option value="ferme">Fermé</option>
                    </select>
                    <input type="text" id="search-code" placeholder="Rechercher par code..." class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <button id="btn-search" class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                        <i data-feather="search" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <!-- Cargaisons List -->
            <div id="cargaisons-list" class="grid gap-6">
                <!-- Les cargaisons seront chargées dynamiquement -->
            </div>
        </main>
    </div>

    <!-- Modal Nouvelle Cargaison -->
    <div id="modal-cargaison" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
        <div class="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold text-gray-900">Nouvelle Cargaison</h3>
                <button id="close-modal" class="text-gray-500 hover:text-gray-700">
                    <i data-feather="x" class="w-6 h-6"></i>
                </button>
            </div>

            <form id="form-cargaison" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Type de Cargaison</label>
                        <select name="type" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option value="">Sélectionner...</option>
                            <option value="maritime">Maritime</option>
                            <option value="aerienne">Aérienne</option>
                            <option value="routiere">Routière</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
                        <input type="number" name="distance" required min="1" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Lieu de Départ</label>
                        <input type="text" name="depart" required placeholder="Ville, Pays" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Lieu d'Arrivée</label>
                        <input type="text" name="arrivee" required placeholder="Ville, Pays" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                </div>

                <div class="flex justify-end space-x-4">
                    <button type="button" id="cancel-modal" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        Annuler
                    </button>
                    <button type="submit" class="gradient-bg text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
                        Créer la Cargaison
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Scripts -->
    <script src="/assets/js/app.js"></script>
    <script src="/assets/js/cargaisons.js"></script>
    <script>
        feather.replace();
        
        document.addEventListener('DOMContentLoaded', function() {
            loadCargaisons();
            initCargaisonModal();
        });
    </script>
</body>
</html>
