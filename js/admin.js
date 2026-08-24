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
                const isChecked = v.disponible !== false ? 'checked' : '';
                tr.innerHTML = `
                    <td class="px-6 py-4">
                        <img src="${v.image_url}" alt="${v.marque_modele}" class="h-12 w-20 object-cover rounded">
                    </td>
                    <td class="px-6 py-4 font-bold text-white">${v.marque_modele}</td>
                    <td class="px-6 py-4">${v.prix_jour} DH/j <br> <span class="text-xs text-gray-500">${v.prix_mois} DH/m</span></td>
                    <td class="px-6 py-4">
                        <div class="flex flex-col items-center gap-2">
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer toggle-dispo" data-id="${v.id_vehicule}" ${isChecked}>
                                <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                            
                            <div class="mt-2 text-xs flex-col gap-1 w-full max-w-[200px] date-inputs-wrapper" id="dates-wrapper-${v.id_vehicule}" style="display: ${isChecked ? 'none' : 'flex'}">
                                <div class="flex items-center justify-between gap-1">
                                    <span class="text-gray-400">Sortie le:</span>
                                    <input type="date" id="date-debut-${v.id_vehicule}" value="${v.indispo_debut || ''}" onclick="this.showPicker()" class="bg-gray-800 text-gray-300 border border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:border-primary cursor-pointer w-full ml-2">
                                </div>
                                <div class="flex items-center justify-between gap-1">
                                    <span class="text-gray-400">Retour le:</span>
                                    <input type="date" id="date-fin-${v.id_vehicule}" value="${v.indispo_fin || ''}" onclick="this.showPicker()" class="bg-gray-800 text-gray-300 border border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:border-primary cursor-pointer w-full ml-2">
                                </div>
                                <button class="mt-1 bg-gray-700 hover:bg-gray-600 text-white rounded px-2 py-1 save-dates-btn" data-id="${v.id_vehicule}">
                                    <i class="fa-solid fa-floppy-disk text-primary"></i> Sauvegarder dates
                                </button>
                            </div>
                        </div>
                    </td>
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
            document.querySelectorAll('.toggle-dispo').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => toggleAvailability(e.target.getAttribute('data-id'), e.target.checked));
            });
            document.querySelectorAll('.save-dates-btn').forEach(btn => {
                btn.addEventListener('click', (e) => saveIndispoDates(e.target.closest('button').getAttribute('data-id')));
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
        
        const previewEl = document.getElementById('car-image-preview');
        const urlInput = document.getElementById('car-image-url');
        const fileInput = document.getElementById('car-image-file');
        
        previewEl.classList.add('hidden');
        urlInput.value = '';
        fileInput.required = true;

        if (id) {
            // Editing mode
            const v = allVehicles.find(item => item.id_vehicule === id);
            if (v) {
                document.getElementById('modal-title').textContent = "Modifier " + v.marque_modele;
                document.getElementById('car-id').value = v.id_vehicule;
                document.getElementById('car-modele').value = v.marque_modele;
                document.getElementById('car-prix-jour').value = v.prix_jour;
                document.getElementById('car-prix-mois').value = v.prix_mois;
                document.getElementById('car-prix-mois').value = v.prix_mois;
                
                // Set details
                document.getElementById('car-carburant').value = v.carburant || "Diesel";
                document.getElementById('car-boite').value = v.boite || "Manuelle";
                document.getElementById('car-passagers').value = v.passagers || 5;
                document.getElementById('car-portes').value = v.portes || 5;
                document.getElementById('car-valises').value = v.valises || 2;
                document.getElementById('car-sacs').value = v.sacs || 1;
                document.getElementById('car-chevaux').value = v.chevaux || 6;
                document.getElementById('car-climatisation').value = v.climatisation || "Oui";
                document.getElementById('car-gps').value = v.gps || "Non";
                document.getElementById('car-franchise').value = v.franchise_vol || "10% de la valeur";
                document.getElementById('car-caution').value = v.caution || 5000;
                
                urlInput.value = v.image_url;
                fileInput.required = false; // Not required when editing unless changing
                previewEl.classList.remove('hidden');
                previewEl.querySelector('span').textContent = v.image_url.split('/').pop() || 'Image URL';
            }
        } else {
            // New car mode: set defaults
            document.getElementById('car-carburant').value = "Diesel";
            document.getElementById('car-boite').value = "Manuelle";
            document.getElementById('car-passagers').value = 5;
            document.getElementById('car-portes').value = 5;
            document.getElementById('car-valises').value = 2;
            document.getElementById('car-sacs').value = 1;
            document.getElementById('car-chevaux').value = 6;
            document.getElementById('car-climatisation').value = "Oui";
            document.getElementById('car-gps').value = "Non";
            document.getElementById('car-franchise').value = "10% de la valeur";
            document.getElementById('car-caution').value = 5000;
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
        
        const submitBtn = carForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enregistrement...';
        
        const idInput = document.getElementById('car-id').value;
        const isNew = !idInput;
        const carId = isNew ? 'veh_' + Date.now() : idInput;
        
        let imageUrl = document.getElementById('car-image-url').value;
        const fileInput = document.getElementById('car-image-file');
        
        try {
            // Convert image to Base64 if a new file is selected
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                imageUrl = await getBase64(file);
            }
            
            // Retain fields that aren't edited in the form
            const existingData = allVehicles.find(item => item.id_vehicule === carId) || {
                age_min: "21 ans",
                permis_min: "2 ans",
                services: ["Kilométrage illimité", "Assurance tous risques"]
            };

            const newCarData = {
                ...existingData,
                id_vehicule: carId,
                marque_modele: document.getElementById('car-modele').value,
                prix_jour: parseInt(document.getElementById('car-prix-jour').value) || 0,
                prix_mois: parseInt(document.getElementById('car-prix-mois').value) || 0,
                image_url: imageUrl,
                carburant: document.getElementById('car-carburant').value,
                boite: document.getElementById('car-boite').value,
                passagers: parseInt(document.getElementById('car-passagers').value) || 5,
                portes: parseInt(document.getElementById('car-portes').value) || 5,
                valises: parseInt(document.getElementById('car-valises').value) || 0,
                sacs: parseInt(document.getElementById('car-sacs').value) || 0,
                chevaux: parseInt(document.getElementById('car-chevaux').value) || 6,
                climatisation: document.getElementById('car-climatisation').value,
                gps: document.getElementById('car-gps').value,
                franchise_vol: document.getElementById('car-franchise').value,
                caution: parseInt(document.getElementById('car-caution').value) || 0,
            };

            await setDoc(doc(db, "vehicules", carId), newCarData);
            closeModal();
            loadVehicles(); // Reload table
        } catch (error) {
            console.error("Erreur lors de l'enregistrement: ", error);
            alert("Erreur lors de l'enregistrement: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enregistrer';
        }
    });

    // --- Helper function to convert File to Base64 with compression ---
    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Max width 800px to save space in Firestore (1MB limit)
                    const MAX_WIDTH = 800;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    }

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

    // --- Status Toggle Logic ---
    async function toggleAvailability(id, isAvailable) {
        try {
            const wrapper = document.getElementById(`dates-wrapper-${id}`);
            if (isAvailable) {
                // If making it available, hide dates and clear them from DB
                wrapper.style.display = 'none';
                await setDoc(doc(db, "vehicules", id), { 
                    disponible: true,
                    indispo_debut: "",
                    indispo_fin: ""
                }, { merge: true });
            } else {
                // If making it unavailable, show dates
                wrapper.style.display = 'flex';
                await setDoc(doc(db, "vehicules", id), { disponible: false }, { merge: true });
            }
        } catch (error) {
            console.error("Erreur de mise à jour: ", error);
            alert("Erreur lors du changement de statut");
            loadVehicles(); // revert toggle visually
        }
    }

    // --- Save Dates Logic ---
    async function saveIndispoDates(id) {
        const dateDebut = document.getElementById(`date-debut-${id}`).value;
        const dateFin = document.getElementById(`date-fin-${id}`).value;
        
        try {
            await setDoc(doc(db, "vehicules", id), { 
                indispo_debut: dateDebut,
                indispo_fin: dateFin
            }, { merge: true });
            
            alert("Dates sauvegardées avec succès !");
        } catch (error) {
            console.error("Erreur lors de la sauvegarde des dates: ", error);
            alert("Erreur lors de la sauvegarde");
        }
    }

});
