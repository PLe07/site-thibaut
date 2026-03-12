// --- NAVIGATION SPA CORRIGÉE ---
function navigate(targetId) {
    console.log("Tentative de navigation vers : " + targetId); // Pour vérifier si le clic marche
    
    const targetPage = document.getElementById('page-' + targetId);
    const allPages = document.querySelectorAll('.page');
    const navItems = document.querySelectorAll('.nav-item');

    if (targetPage) {
        // 1. Cacher toutes les pages
        allPages.forEach(page => {
            page.classList.remove('active');
            page.style.display = 'none'; // Sécurité supplémentaire
        });

        // 2. Afficher la page cible
        targetPage.classList.add('active');
        targetPage.style.display = 'block';

        // 3. Gérer les classes actives sur le menu
        navItems.forEach(link => {
            link.classList.remove('active');
            if(link.getAttribute('data-target') === targetId) {
                link.classList.add('active');
            }
        });

        // 4. Retour en haut
        window.scrollTo(0, 0);

        // 5. Fonctions spécifiques
        if(targetId === 'catalogue' && typeof renderCatalogue === 'function') {
            renderCatalogue();
        }
    } else {
        console.error("ERREUR : La section avec l'ID 'page-" + targetId + "' n'existe pas dans le HTML.");
    }
}
// ==========================================
// 2. SIMULATEUR FISCAL
// ==========================================
const DURATIONS = [
    { years: 6, rate: 0.12 },
    { years: 9, rate: 0.18 },
    { years: 12, rate: 0.21 }
];
let currentDurationIndex = 1;

function formatEur(num) {
    return new Intl.NumberFormat('fr-FR').format(Math.round(num)) + ' €';
}

function setSafeText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function updateSim() {
    try {
        const prix = parseFloat(document.getElementById('sim-prix')?.value) || 0;
        const notairePct = parseFloat(document.getElementById('sim-notaire-pct')?.value) || 8;
        const travaux = parseFloat(document.getElementById('sim-travaux')?.value) || 0;
        const surface = parseFloat(document.getElementById('sim-surface')?.value) || 0;
        
        const apport = parseFloat(document.getElementById('sim-apport')?.value) || 0;
        const revenus = parseFloat(document.getElementById('sim-revenus')?.value) || 0;
        const tauxPret = parseFloat(document.getElementById('sim-taux')?.value) || 0;
        const nbMois = parseFloat(document.getElementById('sim-duree-mois')?.value) || 0;
        const assurancePct = 0.36; // Valeur par défaut si besoin

        const notaireMontant = prix * (notairePct / 100);
        setSafeText('val-notaire-montant', `= ${formatEur(notaireMontant)}`);

        const totalProjet = prix + notaireMontant + travaux;
        const ratioTravaux = totalProjet > 0 ? (travaux / totalProjet) * 100 : 0;
        const isEligible = ratioTravaux >= 25;
        
        const assiette = Math.min(totalProjet, 300000);
        const durationObj = DURATIONS[currentDurationIndex];
        const reduction = assiette * durationObj.rate;
        const reductionAn = reduction / durationObj.years;

        const coeff = surface > 0 ? Math.min(1.2, 0.7 + (19/surface)) : 0;
        const loyer = (9.83 * surface * coeff).toFixed(0);

        const capitalEmprunte = Math.max(0, totalProjet - apport);
        const tauxMensuel = (tauxPret / 100) / 12;
        
        let mensualitePret = 0;
        if (tauxMensuel > 0 && nbMois > 0) {
            mensualitePret = capitalEmprunte * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1);
        } else if (nbMois > 0) {
            mensualitePret = capitalEmprunte / nbMois; 
        }
        
        const assuranceMensuelle = (capitalEmprunte * (assurancePct / 100)) / 12;
        const mensualiteTotale = mensualitePret + assuranceMensuelle;
        const tauxEndettement = revenus > 0 ? (mensualiteTotale / revenus) * 100 : 0;
        
        // MAJ Interface
        setSafeText('res-resume-prix', formatEur(prix));
        setSafeText('res-resume-notaire', formatEur(notaireMontant));
        setSafeText('res-resume-travaux', formatEur(travaux));
        setSafeText('res-resume-reduction', formatEur(reduction));
        setSafeText('res-reduction', formatEur(reduction));
        setSafeText('res-sub', `sur ${durationObj.years} ans • soit ${formatEur(reductionAn)}/an`);
        setSafeText('res-assiette', formatEur(assiette));
        setSafeText('res-loyer', loyer + ' €/mois');
        
        const resRatio = document.getElementById('res-ratio');
        if (resRatio) {
            resRatio.innerText = ratioTravaux.toFixed(1) + '%';
            resRatio.className = isEligible ? 'bold text-primary' : 'bold text-red';
        }

        setSafeText('res-mensualite', formatEur(mensualitePret));
        setSafeText('res-endettement-txt', tauxEndettement.toFixed(1) + '%');
        
        const barFill = document.getElementById('res-endettement-bar');
        if (barFill) barFill.style.width = Math.min(tauxEndettement, 100) + '%';

    } catch(e) { console.error(e); }
}

function setDuree(index) {
    currentDurationIndex = index;
    const cards = document.querySelectorAll('.duree-card');
    cards.forEach((card, i) => {
        card.classList.toggle('active', i === index);
    });
    updateSim();
}

function renderCatalogue() {}

// ==========================================
// 3. LOGIQUE WEBHOOK & MODALES
// ==========================================
const WEBHOOK_URL = "https://hook.eu1.make.com/ztu9s3dt8jtlycb3kvvvgkjkn36ii6k1"; 

function openModal() {
    const modal = document.getElementById('lead-modal');
    if (modal) modal.classList.add('active');
}

function closeModal(event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('lead-modal');
    if (modal) modal.classList.remove('active');
}

// Spécifique au choix GPS dans le footer
function openMapChoice() {
    const mapModal = document.getElementById('map-modal');
    if (mapModal) mapModal.style.display = 'flex';
}

// Spécifique à l'appel téléphonique
function confirmCall() {
    const phoneNumber = "05 57 75 10 10";
    if (confirm("Souhaitez-vous appeler Transac Express au " + phoneNumber + " ?")) {
        window.location.href = "tel:+33557751010";
    }
}

async function submitForm(event) {
    event.preventDefault(); 
    // ... (votre logique submitForm actuelle est correcte)
}

// ==========================================
// 4. INITIALISATION
// ==========================================
window.onload = () => {
    updateSim();
    renderCatalogue();
}
