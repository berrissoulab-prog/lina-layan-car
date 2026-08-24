import { db, collection, getDocs, addDoc } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    // ---- Global State ----
    let vehicules = [];
    
    // Fetch vehicles from Firebase
    try {
        const querySnapshot = await getDocs(collection(db, "vehicules"));
        querySnapshot.forEach((docSnap) => {
            const v = docSnap.data();
            v.id_vehicule = docSnap.id;
            vehicules.push(v);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des véhicules:", error);
    }

    // ---- Mobile Menu ----
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    mobileBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // ---- Client Mode Logic ----
    let clientMode = null; // 'particulier' or 'entreprise'
    const modeModal = document.getElementById('mode-modal');
    const btnParticulier = document.getElementById('btn-particulier');
    const btnEntreprise = document.getElementById('btn-entreprise');
    const containerDateFin = document.getElementById('container-date-fin');
    const containerMois = document.getElementById('container-mois');
    const inputDateFin = document.getElementById('date-fin');
    const inputDureeMois = document.getElementById('duree-mois');

    function setClientMode(mode) {
        clientMode = mode;
        modeModal.classList.add('opacity-0');
        setTimeout(() => {
            modeModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }, 300);

        if (mode === 'particulier') {
            containerDateFin.classList.remove('hidden');
            containerMois.classList.add('hidden');
            inputDateFin.required = true;
            inputDureeMois.required = false;
        } else {
            containerDateFin.classList.add('hidden');
            containerMois.classList.remove('hidden');
            inputDateFin.required = false;
            inputDureeMois.required = true;
        }
        
        if (typeof updateMinFinDate === 'function') {
            updateMinFinDate();
        }
    }

    btnParticulier.addEventListener('click', () => setClientMode('particulier'));
    btnEntreprise.addEventListener('click', () => setClientMode('entreprise'));

    // ---- Date Logic ----
    const dateDebutInput = document.getElementById('date-debut');
    const dateFinInput = document.getElementById('date-fin');
    const searchForm = document.getElementById('search-form');
    const dateError = document.getElementById('date-error');
    const resultsSection = document.getElementById('resultats-section');
    const nbJoursSpan = document.getElementById('nb-jours');
    
    // Set min date to today
    const todayStr = new Date().toISOString().split('T')[0];
    dateDebutInput.min = todayStr;
    
    function updateMinFinDate() {
        let baseDate = new Date(dateDebutInput.value || todayStr);
        if (clientMode === 'particulier') {
            // Minimum 4 days for particulier
            baseDate.setDate(baseDate.getDate() + 4);
        }
        dateFinInput.min = baseDate.toISOString().split('T')[0];
        
        // If current fin date is less than the new min, clear it
        if (dateFinInput.value && new Date(dateFinInput.value) < baseDate) {
            dateFinInput.value = '';
        }
    }
    
    // Call it once on load
    updateMinFinDate();

    dateDebutInput.addEventListener('change', updateMinFinDate);

    let currentDuration = 0;
    let globalDates = { debut: '', fin: '', mois: '' };

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const debut = new Date(dateDebutInput.value);
        globalDates.debut = dateDebutInput.value;

        if (clientMode === 'particulier') {
            const fin = new Date(dateFinInput.value);
            if (fin <= debut) {
                dateError.classList.remove('hidden');
                return;
            }
            dateError.classList.add('hidden');
            
            const diffTime = Math.abs(fin - debut);
            currentDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            globalDates.fin = dateFinInput.value;
            
            document.getElementById('label-duree').textContent = "jour(s)";
        } else {
            // Entreprise Mode
            currentDuration = parseInt(inputDureeMois.value);
            globalDates.mois = inputDureeMois.value;
            dateError.classList.add('hidden');
            
            document.getElementById('label-duree').textContent = "mois";
        }
        
        nbJoursSpan.textContent = currentDuration;

        // Show results and scroll
        resultsSection.classList.remove('hidden');
        renderVehicles(vehicules); // from Firebase
        
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });


    // ---- Render Vehicles ----
    const grid = document.getElementById('vehicules-grid');

    function renderVehicles(data) {
        grid.innerHTML = '';
        data.forEach(v => {
            const card = document.createElement('div');
            const isUnavailable = v.disponible === false;
            
            card.className = `glass-card rounded-2xl overflow-hidden flex flex-col h-full animate-fade-in ${isUnavailable ? 'opacity-70 grayscale-[50%]' : ''}`;
            
            card.innerHTML = `
                <div class="relative h-48 overflow-hidden">
                    <img src="${v.image_url}" alt="${v.marque_modele}" class="w-full h-full object-cover ${!isUnavailable ? 'transition duration-500 hover:scale-110' : ''}">
                    <div class="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold border border-white/10">
                        ${v.boite}
                    </div>
                    ${isUnavailable ? `
                    <div class="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                        <span class="bg-red-600 text-white font-bold px-4 py-2 rounded-lg transform -rotate-12 border-2 border-white shadow-xl">En Location</span>
                    </div>
                    ` : ''}
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <h3 class="text-xl font-bold text-white mb-1">${v.marque_modele}</h3>
                    <p class="text-gray-400 text-sm mb-4"><i class="fa-solid fa-gas-pump text-primary mr-1"></i> ${v.carburant} &nbsp;&bull;&nbsp; <i class="fa-solid fa-users text-primary mr-1"></i> ${v.passagers} places</p>
                    
                    <div class="mt-auto pt-4 border-t border-gray-800 flex items-end justify-between">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">À partir de</p>
                            <p class="text-2xl font-bold text-primary leading-none">${clientMode === 'entreprise' ? v.prix_mois : v.prix_jour} <span class="text-sm font-normal text-white">${clientMode === 'entreprise' ? 'DH/mois' : 'DH/j'}</span></p>
                        </div>
                        <div class="text-right">
                             <p class="text-xs text-gray-500 mb-1">Caution</p>
                             <p class="text-sm font-semibold text-gray-300">${v.caution} DH</p>
                        </div>
                    </div>
                    
                    ${isUnavailable ? `
                    <button class="mt-5 w-full bg-gray-800 text-gray-400 py-2 rounded-lg font-bold text-sm cursor-not-allowed" disabled>
                        Indisponible
                    </button>
                    ` : `
                    <button class="mt-5 w-full btn-primary py-2 rounded-lg font-bold text-sm open-modal-btn" data-id="${v.id_vehicule}">
                        Plus de détails
                    </button>
                    `}
                </div>
            `;
            grid.appendChild(card);
        });

        // Attach modal events to new buttons
        document.querySelectorAll('.open-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                openModal(id);
            });
        });
    }

    // ---- Filtering ----
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            filterBtns.forEach(b => {
                b.classList.remove('active', 'bg-primary', 'text-white', 'border-primary');
                b.classList.add('border-gray-700', 'text-gray-300');
            });
            e.target.classList.remove('border-gray-700', 'text-gray-300');
            e.target.classList.add('active', 'bg-primary', 'text-white', 'border-primary');

            const filterValue = e.target.getAttribute('data-filter');
            if (filterValue === 'all') {
                renderVehicles(vehicules);
            } else {
                const filtered = vehicules.filter(v => v.boite === filterValue);
                renderVehicles(filtered);
            }
        });
    });

    // ---- Modal Logic ----
    const modal = document.getElementById('car-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const overlay = document.getElementById('close-modal-overlay');
    const modalContentContainer = document.getElementById('modal-content-container');

    function openModal(id) {
        const v = vehicules.find(item => item.id_vehicule === id);
        if (!v) return;

        // Populate Data
        document.getElementById('modal-img').src = v.image_url;
        document.getElementById('modal-title').textContent = v.marque_modele;
        document.getElementById('modal-prix').textContent = clientMode === 'entreprise' ? v.prix_mois : v.prix_jour;
        document.getElementById('modal-prix').nextElementSibling.textContent = clientMode === 'entreprise' ? '/ mois' : '/ jour';
        
        // Total Price Calculation
        const totalContainer = document.getElementById('modal-total-container');
        if (totalContainer && currentDuration > 0) {
            const totalPrice = clientMode === 'entreprise' ? (v.prix_mois * currentDuration) : (v.prix_jour * currentDuration);
            document.getElementById('modal-total-price').textContent = totalPrice + ' DH';
            totalContainer.classList.remove('hidden');
        } else if (totalContainer) {
            totalContainer.classList.add('hidden');
        }
        
        // Attributes string building
        const attrs = [
            `${v.carburant}`,
            `BV ${v.boite}`,
            `${v.passagers} passagers`,
            `${v.portes} portes`,
            `${v.valises} valises`,
            `${v.sacs} sac(s)`,
            `${v.chevaux} Ch. Fisc.`,
            `A/C : ${v.climatisation}`,
            `GPS : ${v.gps}`
        ];
        
        document.getElementById('modal-attributes').innerHTML = attrs.map(attr => 
            `<span class="bg-gray-800 px-2 py-1 rounded text-xs">${attr}</span>`
        ).join('');

        // Services
        document.getElementById('modal-services').innerHTML = v.services.map(s => 
            `<li>${s}</li>`
        ).join('');

        // Finances & Requis
        document.getElementById('modal-franchise').textContent = v.franchise_vol;
        document.getElementById('modal-caution').textContent = v.caution;
        document.getElementById('modal-age').textContent = v.age_min;
        document.getElementById('modal-permis').textContent = v.permis_min;

        // Form
        document.getElementById('res-car-id').value = id;

        // Show Modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Small delay for transition
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContentContainer.classList.remove('scale-95');
            modalContentContainer.classList.add('scale-100');
        }, 10);
        
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeModal() {
        modal.classList.add('opacity-0');
        modalContentContainer.classList.remove('scale-100');
        modalContentContainer.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = 'auto';
        }, 300);
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // ---- WhatsApp Reservation Form & Saving to Firebase ----
    const reservationForm = document.getElementById('reservation-form');
    
    reservationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = reservationForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> En cours...';
        
        const nom = document.getElementById('res-nom').value;
        const tel = document.getElementById('res-tel').value;
        const carId = document.getElementById('res-car-id').value;
        const car = vehicules.find(item => item.id_vehicule === carId);
        
        if (!car || !globalDates.debut) {
            alert("Erreur: Veuillez sélectionner des dates sur la page d'accueil d'abord.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }
        if (clientMode === 'particulier' && !globalDates.fin) {
            alert("Erreur: Veuillez sélectionner une date de retour.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }

        let totalPrice = 0;
        if (clientMode === 'particulier') {
            totalPrice = car.prix_jour * currentDuration;
        } else {
            totalPrice = car.prix_mois * currentDuration;
        }

        // Save reservation to Firebase
        try {
            await addDoc(collection(db, "reservations"), {
                vehicule_id: car.id_vehicule,
                marque_modele: car.marque_modele,
                client_nom: nom,
                client_tel: tel,
                client_mode: clientMode,
                date_debut: globalDates.debut,
                date_fin: clientMode === 'particulier' ? globalDates.fin : null,
                duree_mois: clientMode === 'entreprise' ? currentDuration : null,
                duree_jours: clientMode === 'particulier' ? currentDuration : null,
                prix_total: totalPrice,
                date_creation: new Date().toISOString(),
                statut: "En attente" // Default status
            });
        } catch (error) {
            console.error("Error saving reservation: ", error);
            // Even if save fails, we proceed to WhatsApp so they don't lose the client
        }

        // WhatsApp Agency Number
        const agencyPhone = "212662733037"; 
        
        let message = `Bonjour Lina Layan Car Rentals,%0A%0AJe souhaite demander une réservation pour le véhicule suivant :%0A%F0%9F%9A%97 *${car.marque_modele}*%0A`;
        
        if (clientMode === 'particulier') {
            message += `%F0%9F%93%85 Du: ${globalDates.debut}%0A%F0%9F%93%85 Au: ${globalDates.fin}%0A%E2%8F%B3 Durée: ${currentDuration} jours%0A%F0%9F%92%B0 Tarif: ${car.prix_jour} DH/jour%0A%F0%9F%92%B5 *Total estimé: ${totalPrice} DH*%0A`;
        } else {
            message += `%F0%9F%93%85 À partir du: ${globalDates.debut}%0A%E2%8F%B3 Durée: ${currentDuration} mois%0A%F0%9F%92%B0 Tarif: ${car.prix_mois} DH/mois%0A%F0%9F%92%B5 *Total estimé: ${totalPrice} DH*%0A`;
        }
        
        message += `%0AMes coordonnées :%0A%F0%9F%91%A4 Nom: ${nom}%0A%F0%9F%93%9E Tél: ${tel}%0A%0AMerci de me recontacter pour la confirmation.`;
        
        const whatsappUrl = `https://wa.me/${agencyPhone}?text=${message}`;
        
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        
        // Open WhatsApp in new tab
        window.open(whatsappUrl, '_blank');
        closeModal();
    });

    // ---- Navbar Scroll Effect ----
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('bg-black/90', 'shadow-lg');
            navbar.classList.remove('glass');
        } else {
            navbar.classList.remove('bg-black/90', 'shadow-lg');
            navbar.classList.add('glass');
        }
    });
});
