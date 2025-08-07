<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suivi Colis - GP du Monde</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.28.0/feather.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .nav-active { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        .status-badge { font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 600; }
        .status-cours { background: #dbeafe; color: #1e40af; }
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
            <div class="max-w-2xl mx-auto">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-bold text-gray-900 mb-4">Suivi de Colis</h2>
                    <p class="text-gray-600">Entrez votre code de suivi pour connaître l'état de votre colis</p>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-8">
                    <div class="flex space-x-4 mb-6">
                        <input type="text" id="code-suivi" placeholder="Entrez votre code de suivi (ex: COL-123456)" 
                               class="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <button id="btn-rechercher" class="gradient-bg text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity font-semibold">
                            <i data-feather="search" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <!-- Résultat de recherche -->
                    <div id="resultat-suivi" class="hidden">
                        <div class="border-t pt-6">
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <h3 class="text-xl font-bold text-gray-900">COL-123456</h3>
                                    <p class="text-gray-600">Produit Alimentaire - 2.5 kg</p>
                                </div>
                                <span class="status-badge status-cours">En cours</span>
                            </div>

                            <div class="space-y-4">
                                <div class="flex items-center space-x-4">
                                    <div class="bg-green-100 p-2 rounded-full">
                                        <i data-feather="check" class="text-green-600 w-4 h-4"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-medium">Colis expédié</p>
                                        <p class="text-sm text-gray-500">Dakar, Sénégal - 15 Jan 2024 à 08:30</p>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-4">
                                    <div class="bg-blue-100 p-2 rounded-full animate-pulse">
                                        <i data-feather="truck" class="text-blue-600 w-4 h-4"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-medium">En cours de livraison</p>
                                        <p class="text-sm text-blue-600">Arrive dans 2 jours</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="/assets/js/app.js"></script>
    <script>
        feather.replace();
        
        document.getElementById('btn-rechercher')?.addEventListener('click', () => {
            const code = document.getElementById('code-suivi').value.trim();
            if (code) {
                setTimeout(() => {
                    document.getElementById('resultat-suivi').classList.remove('hidden');
                }, 500);
            } else {
                alert('Veuillez entrer un code de suivi');
            }
        });
    </script>
</body>
</html>
