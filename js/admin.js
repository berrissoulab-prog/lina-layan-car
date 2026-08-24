import { auth, db, signInWithEmailAndPassword, onAuthStateChanged, signOut, collection, getDocs, doc, setDoc, deleteDoc } from "./firebase-config.js";

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

    // Modal elements
    const carModal = document.getElementById('car-modal');
    const closeModalOverlay = document.getElementById('close-modal-overlay');
    const btnCancelCar = document.getElementById('btn-cancel-car');
    const btnAddCar = document.getElementById('btn-add-car');
    const carForm = document.getElementById('car-form');
    
    let allVehicles = []; // Store loaded vehicles for easy editing

    // --- Authentication ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            loadVehicles();
        } else {
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

    btnLogout.addEventListener('click', () => signOut(auth));

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
            allVehicles = [];
            
            querySnapshot.forEach((docSnap) => {
                const v = docSnap.data();
                // Ensure ID is present
                v.id_vehicule = docSnap.id;
                allVehicles.push(v);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4">
                        <img src="${v.image_url}" alt="${v.marque_modele}" class="h-12 w-20 object-cover rounded">
                    </td>
                    <td class="px-6 py-4 font-bold text-white">${v.marque_modele}</td>
                    <td class="px-6 py-4">${v.prix_jour} DH/j <br> <span class="text-xs text-gray-500">${v.prix_mois} DH/m</span></td>
                    <td class="px-6 py-4">
                        <button class="text-blue-500 hover:text-blue-400 mr-3 edit-btn" data-id="${v.id_vehicule}">Modifier</button>
                        <button class="text-red-500 hover:text-red-400 delete-btn" data-id="${v.id_vehicule}">Supprimer</button>
                    </td>
                `;
                tableVehicules.appendChild(tr);
            });

            // Attach event listeners to new buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => openModal(e.target.getAttribute('data-id')));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => deleteVehicle(e.target.getAttribute('data-id')));
            });

        } catch (error) {
            console.error("Error loading vehicles: ", error);
            tableVehicules.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Erreur de chargement.</td></tr>';
        }
    }

    // --- Modal Logic ---
    function openModal(id = null) {
        carForm.reset();
        document.getElementById('car-id').value = '';
        document.getElementById('modal-title').textContent = "Ajouter un Véhicule";

        if (id) {
            // Editing mode
            const v = allVehicles.find(item => item.id_vehicule === id);
            if (v) {
                document.getElementById('modal-title').textContent = "Modifier " + v.marque_modele;
                document.getElementById('car-id').value = v.id_vehicule;
                document.getElementById('car-modele').value = v.marque_modele;
                document.getElementById('car-prix-jour').value = v.prix_jour;
                document.getElementById('car-prix-mois').value = v.prix_mois;
                document.getElementById('car-image').value = v.image_url;
            }
        }
        
        carModal.classList.remove('hidden');
        carModal.classList.add('flex');
    }

    function closeModal() {
        carModal.classList.add('hidden');
        carModal.classList.remove('flex');
    }

    btnAddCar.addEventListener('click', () => openModal());
    closeModalOverlay.addEventListener('click', closeModal);
    btnCancelCar.addEventListener('click', closeModal);

    // --- Save (Add/Edit) Logic ---
    carForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const idInput = document.getElementById('car-id').value;
        const isNew = !idInput;
        
        // Use existing ID or create a new unique one
        const carId = isNew ? 'veh_' + Date.now() : idInput;
        
        // Find existing data if editing, or create a default object for new
        const existingData = allVehicles.find(item => item.id_vehicule === carId) || {
            boite: "Manuelle",
            carburant: "Diesel",
            caution: 5000,
            franchise_vol: "10% de la valeur",
            passagers: 5,
            portes: 5,
            valises: 2,
            sacs: 1,
            chevaux: 6,
            climatisation: "Oui",
            gps: "Non",
            age_min: "21 ans",
            permis_min: "2 ans",
            services: ["Kilométrage illimité", "Assurance tous risques"]
        };

        const newCarData = {
            ...existingData,
            id_vehicule: carId,
            marque_modele: document.getElementById('car-modele').value,
            prix_jour: parseInt(document.getElementById('car-prix-jour').value),
            prix_mois: parseInt(document.getElementById('car-prix-mois').value),
            image_url: document.getElementById('car-image').value
        };

        try {
            await setDoc(doc(db, "vehicules", carId), newCarData);
            closeModal();
            loadVehicles(); // Reload table
        } catch (error) {
            console.error("Erreur lors de l'enregistrement: ", error);
            alert("Erreur lors de l'enregistrement");
        }
    });

    // --- Delete Logic ---
    async function deleteVehicle(id) {
        if (confirm("Voulez-vous vraiment supprimer ce véhicule ?")) {
            try {
                await deleteDoc(doc(db, "vehicules", id));
                loadVehicles(); // Reload table
            } catch (error) {
                console.error("Erreur lors de la suppression: ", error);
                alert("Erreur lors de la suppression");
            }
        }
    }

});
