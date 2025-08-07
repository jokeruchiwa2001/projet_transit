<aside class="w-64 bg-white shadow-lg">
    <nav class="mt-6 px-6">
        <div class="space-y-2">
            <a href="/dashboard" class="nav-item <?= ($_SERVER['REQUEST_URI'] == '/dashboard' || $_SERVER['REQUEST_URI'] == '/') ? 'nav-active' : 'text-gray-700 hover:bg-gray-100' ?> flex items-center px-4 py-3 rounded-lg">
                <i data-feather="home" class="mr-3 w-5 h-5"></i>
                Tableau de bord
            </a>
            <a href="/cargaisons" class="nav-item <?= ($_SERVER['REQUEST_URI'] == '/cargaisons') ? 'nav-active' : 'text-gray-700 hover:bg-gray-100' ?> flex items-center px-4 py-3 rounded-lg">
                <i data-feather="package" class="mr-3 w-5 h-5"></i>
                Cargaisons
            </a>
            <a href="#" class="nav-item flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                <i data-feather="box" class="mr-3 w-5 h-5"></i>
                Colis
            </a>
            <a href="/clients" class="nav-item <?= ($_SERVER['REQUEST_URI'] == '/clients') ? 'nav-active' : 'text-gray-700 hover:bg-gray-100' ?> flex items-center px-4 py-3 rounded-lg">
                <i data-feather="users" class="mr-3 w-5 h-5"></i>
                Clients
            </a>
            <a href="/suivi" class="nav-item <?= ($_SERVER['REQUEST_URI'] == '/suivi') ? 'nav-active' : 'text-gray-700 hover:bg-gray-100' ?> flex items-center px-4 py-3 rounded-lg">
                <i data-feather="search" class="mr-3 w-5 h-5"></i>
                Suivi Colis
            </a>
        </div>
    </nav>
</aside>
