import { db, collection, doc, setDoc } from "./firebase-config.js";

async function seedVehicles() {
    const statusEl = document.getElementById("status");
    statusEl.innerText = "Début de la migration...";

    try {
        if (typeof vehicules === 'undefined') {
            throw new Error("Le fichier vehicules.js n'a pas été chargé correctement.");
        }

        const vehiculesRef = collection(db, "vehicules");
        let count = 0;

        for (const v of vehicules) {
            // Use the id_vehicule as the document ID
            const docRef = doc(vehiculesRef, v.id_vehicule);
            await setDoc(docRef, v);
            count++;
            console.log(`Ajouté : ${v.marque_modele}`);
        }

        statusEl.innerText = `Succès ! ${count} véhicules ont été ajoutés à Firebase.`;
        statusEl.style.color = "green";
    } catch (error) {
        console.error("Erreur lors de la migration:", error);
        statusEl.innerText = "Erreur: " + error.message;
        statusEl.style.color = "red";
    }
}

// Run the seed function
seedVehicles();
