<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clients - GP du Monde</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.28.0/feather.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .nav-active { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
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
                <h2 class="text-2xl font-bold text-gray-900">Gestion des Clients</h2>
                <button id="btn-nouveau-client" class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-semibold">
                    <i data-feather="user-plus" class="inline-block w-5 h-5 mr-2"></i>
                    Nouveau Client
                </button>
            </div>

            <div class="bg-white rounded-xl shadow-sm">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex space-x-4">
                        <input type="text" placeholder="Rechercher un client..." class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <button class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                            <i data-feather="search" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colis Envoyés</th>
                                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernier Envoi</th>
                                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span class="font-medium text-purple-600">JD</span>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">Jean Dupont</div>
                                            <div class="text-sm text-gray-500">Dakar, Plateau</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm text-gray-900">+221 77 123 45 67</div>
                                    <div class="text-sm text-gray-500">j.dupont@email.com</div>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-900">12 colis</td>
                                <td class="px-6 py-4 text-sm text-gray-500">15 Jan 2024</td>
                                <td class="px-6 py-4 text-sm font-medium space-x-2">
                                    <button class="text-blue-600 hover:text-blue-900">Voir</button>
                                    <button class="text-gray-600 hover:text-gray-900">Modifier</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <script src="/assets/js/app.js"></script>
    <script>feather.replace();</script>
</body>
</html>
