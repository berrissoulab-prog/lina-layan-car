document.addEventListener('DOMContentLoaded', () => {
    // ---- Mobile Menu ----
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    mobileBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // ---- Date Logic ----
    const dateDebutInput = document.getElementById('date-debut');
    const dateFinInput = document.getElementById('date-fin');
    const searchForm = document.getElementById('search-form');
    const dateError = document.getElementById('date-error');
    const resultsSection = document.getElementById('resultats-section');
    const nbJoursSpan = document.getElementById('nb-jours');
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    dateDebutInput.min = today;
    dateFinInput.min = today;

    dateDebutInput.addEventListener('change', () => {
        dateFinInput.min = dateDebutInput.value;
    });

    let currentNbJours = 0;
    let globalDates = { debut: '', fin: '' };

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const debut = new Date(dateDebutInput.value);
        const fin = new Date(dateFinInput.value);

        if (fin <= debut) {
            dateError.classList.remove('hidden');
            return;
        }
        
        dateError.classList.add('hidden');

        // Calculate diff in days
        const diffTime = Math.abs(fin - debut);
        currentNbJours = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        nbJoursSpan.textContent = currentNbJours;
        
        globalDates.debut = dateDebutInput.value;
        globalDates.fin = dateFinInput.value;

        // Show results and scroll
        resultsSection.classList.remove('hidden');
        renderVehicles(vehicules); // from data/vehicules.js
        
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
            card.className = 'glass-card rounded-2xl overflow-hidden flex flex-col h-full animate-fade-in';
            
            card.innerHTML = `
                <div class="relative h-48 overflow-hidden">
                    <img src="${v.image_url}" alt="${v.marque_modele}" class="w-full h-full object-cover transition duration-500 hover:scale-110">
                    <div class="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold border border-white/10">
                        ${v.boite}
                    </div>
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <h3 class="text-xl font-bold text-white mb-1">${v.marque_modele}</h3>
                    <p class="text-gray-400 text-sm mb-4"><i class="fa-solid fa-gas-pump text-primary mr-1"></i> ${v.carburant} &nbsp;&bull;&nbsp; <i class="fa-solid fa-users text-primary mr-1"></i> ${v.passagers} places</p>
                    
                    <div class="mt-auto pt-4 border-t border-gray-800 flex items-end justify-between">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">À partir de</p>
                            <p class="text-2xl font-bold text-primary leading-none">${v.prix_jour} <span class="text-sm font-normal text-white">DH/j</span></p>
                        </div>
                        <div class="text-right">
                             <p class="text-xs text-gray-500 mb-1">Caution</p>
                             <p class="text-sm font-semibold text-gray-300">${v.caution} DH</p>
                        </div>
                    </div>
                    
                    <button class="mt-5 w-full btn-primary py-2 rounded-lg font-bold text-sm open-modal-btn" data-id="${v.id_vehicule}">
                        Plus de détails
                    </button>
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
        document.getElementById('modal-prix').textContent = v.prix_jour;
        
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

    // ---- WhatsApp Reservation Form ----
    const reservationForm = document.getElementById('reservation-form');
    
    reservationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nom = document.getElementById('res-nom').value;
        const tel = document.getElementById('res-tel').value;
        const carId = document.getElementById('res-car-id').value;
        const car = vehicules.find(item => item.id_vehicule === carId);
        
        if (!car || !globalDates.debut || !globalDates.fin) {
            alert("Erreur: Veuillez sélectionner des dates sur la page d'accueil d'abord.");
            return;
        }

        // WhatsApp Agency Number
        const agencyPhone = "212662733037"; 
        
        const message = `Bonjour Lina Layan Car Rentals,%0A%0AJe souhaite demander une réservation pour le véhicule suivant :%0A🚗 *${car.marque_modele}*%0A📅 Du: ${globalDates.debut}%0A📅 Au: ${globalDates.fin}%0A⏳ Durée: ${currentNbJours} jours%0A%0AMes coordonnées :%0A👤 Nom: ${nom}%0A📞 Tél: ${tel}%0A%0AMerci de me recontacter pour la confirmation.`;
        
        const whatsappUrl = `https://wa.me/${agencyPhone}?text=${message}`;
        
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
