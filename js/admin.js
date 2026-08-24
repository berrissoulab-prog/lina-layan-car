import { auth, db, signInWithEmailAndPassword, onAuthStateChanged, signOut, collection, getDocs } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
    
    // --- DOM Elements ---
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');
    
    const tabVehicules = document.getElementById('tab-vehicules');
    const tabReservations = document.getElementById('tab-reservations');
    const sectionVehicules = document.getElementById('section-vehicules');
    const sectionReservations = document.getElementById('section-reservations');
    const tableVehicules = document.getElementById('table-vehicules');

    // --- Authentication ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            loginScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            loadVehicles();
        } else {
            // User is signed out
            loginScreen.classList.remove('hidden');
            dashboardScreen.classList.add('hidden');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            loginError.classList.add('hidden');
        } catch (error) {
            loginError.textContent = "Email ou mot de passe incorrect.";
            loginError.classList.remove('hidden');
        }
    });

    btnLogout.addEventListener('click', () => {
        signOut(auth);
    });

    // --- Tabs Logic ---
    tabVehicules.addEventListener('click', () => {
        sectionVehicules.classList.remove('hidden');
        sectionReservations.classList.add('hidden');
        tabVehicules.classList.add('border-b-2', 'border-primary', 'text-white');
        tabVehicules.classList.remove('text-gray-400');
        tabReservations.classList.remove('border-b-2', 'border-primary', 'text-white');
        tabReservations.classList.add('text-gray-400');
    });

    tabReservations.addEventListener('click', () => {
        sectionReservations.classList.remove('hidden');
        sectionVehicules.classList.add('hidden');
        tabReservations.classList.add('border-b-2', 'border-primary', 'text-white');
        tabReservations.classList.remove('text-gray-400');
        tabVehicules.classList.remove('border-b-2', 'border-primary', 'text-white');
        tabVehicules.classList.add('text-gray-400');
    });

    // --- Load Data ---
    async function loadVehicles() {
        tableVehicules.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center">Chargement...</td></tr>';
        try {
            const querySnapshot = await getDocs(collection(db, "vehicules"));
            tableVehicules.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const v = doc.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4">
                        <img src="${v.image_url}" alt="${v.marque_modele}" class="h-12 w-20 object-cover rounded">
                    </td>
                    <td class="px-6 py-4 font-bold text-white">${v.marque_modele}</td>
                    <td class="px-6 py-4">${v.prix_jour} DH/j <br> <span class="text-xs text-gray-500">${v.prix_mois} DH/m</span></td>
                    <td class="px-6 py-4">
                        <button class="text-blue-500 hover:text-blue-400 mr-3">Modifier</button>
                        <button class="text-red-500 hover:text-red-400">Supprimer</button>
                    </td>
                `;
                tableVehicules.appendChild(tr);
            });
        } catch (error) {
            console.error("Error loading vehicles: ", error);
            tableVehicules.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Erreur de chargement.</td></tr>';
        }
    }

});
