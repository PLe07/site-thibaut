// --- NAVIGATION SPA ---
function navigate(targetId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('page-' + targetId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('data-target') === targetId) {
            link.classList.add('active');
        }
    });
    window.scrollTo(0, 0);
    if(targetId === 'catalogue') renderCatalogue();
}

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
        const assurancePct = parseFloat(document.getElementById('sim-assurance')?.value) || 0;

        const notaireMontant = prix * (notairePct / 100);
        setSafeText('val-notaire-montant', `= ${formatEur(notaireMontant)}`);

        // Assiette globale
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
        setSafeText('res-loyer-detail', `Base : 9.83 €/m² × ${surface} m² × coeff. B2 (${coeff.toFixed(2)})`);
        
        const alertRatio = document.getElementById('alert-ratio');
        const resRatio = document.getElementById('res-ratio');
        if (resRatio) {
            resRatio.innerText = ratioTravaux.toFixed(1) + '%';
            resRatio.className = isEligible ? 'bold text-primary' : 'bold text-red';
        }
        if (alertRatio) {
            alertRatio.style.display = isEligible ? 'none' : 'block';
        }
        setSafeText('val-ratio-alert', ratioTravaux.toFixed(1) + '%');

        setSafeText('res-mensualite', formatEur(mensualitePret));
        setSafeText('res-mensualite-detail', `+ ${Math.round(assuranceMensuelle)}€ d'assurance emprunteur`);

        setSafeText('res-endettement-txt', tauxEndettement.toFixed(1) + '%');
        
        const barFill = document.getElementById('res-endettement-bar');
        const budgetContainer = document.getElementById('budget-container');
        const budgetStatus = document.getElementById('res-endettement-status');
        const headerColor = document.getElementById('budget-header');
        
        if (barFill && budgetContainer && budgetStatus && headerColor) {
            barFill.style.width = Math.min(tauxEndettement, 100) + '%';
            if(tauxEndettement <= 35) {
                budgetContainer.style.background = '#F9F9F7'; 
                budgetContainer.style.borderColor = 'rgba(197, 160, 89, 0.4)'; 
                headerColor.style.color = '#1A2B3C';
                barFill.style.background = '#C5A059';
                budgetStatus.innerText = `✅ Capacité d'emprunt respectée (<35%)`;
                budgetStatus.style.color = '#1A2B3C';
            } else {
                budgetContainer.style.background = '#FAF5F5'; 
                budgetContainer.style.borderColor = '#C5A059'; 
                headerColor.style.color = '#1A2B3C';
                barFill.style.background = '#1A2B3C';
                budgetStatus.innerText = `⚠️ Alerte : Endettement élevé (>35%)`;
                budgetStatus.style.color = '#1A2B3C';
            }
        }
    } catch(e) {
        console.error("Erreur de calcul :", e);
    }
}

function setDuree(index) {
    currentDurationIndex = index;
    const cards = document.querySelectorAll('.duree-card');
    cards.forEach((card, i) => {
        if(i === index) { card.classList.add('active'); card.querySelector('.duree-pct').classList.add('text-red'); }
        else { card.classList.remove('active'); card.querySelector('.duree-pct').classList.remove('text-red'); }
    });
    updateSim();
}

function renderCatalogue() {}


// ==========================================
// LOGIQUE WEBHOOK (MAKE/ZAPIER)
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

async function sendToAutomation(data) {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.ok;
    } catch (error) {
        console.error("Erreur d'envoi Webhook :", error);
        return false;
    }
}

async function submitForm(event) {
    event.preventDefault(); 
    
    const btn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const form = document.getElementById('lead-form');
    const successMsg = document.getElementById('success-message');
    const introText = document.getElementById('modal-intro');
    const noteText = document.getElementById('modal-note');
    
    // Prénom (pour la personnalisation)
    const fullName = document.getElementById('lead-name').value;
    const firstName = fullName.split(' ')[0];
    
    // 1. État "Chargement" visuel (Sécurité anti double clic)
    btn.disabled = true;
    btn.style.opacity = "0.8";
    btnText.innerText = "TRAITEMENT EN COURS...";
    btnLoader.style.display = "inline-block";
    
    // 2. Compilation des données (Formulaire + Simulateur)
    const leadData = {
        date: new Date().toISOString(),
        nom: fullName,
        email: document.getElementById('lead-email').value,
        telephone: document.getElementById('lead-phone').value || "Non renseigné",
        projet_prix_achat: document.getElementById('res-resume-prix').innerText,
        projet_notaire: document.getElementById('res-resume-notaire').innerText,
        projet_travaux: document.getElementById('res-resume-travaux').innerText,
        projet_economie_impot: document.getElementById('res-resume-reduction').innerText
    };
    
    // 3. Envoi via Webhook Make
    const isSuccess = await sendToAutomation(leadData);
    
    // 4. Succès ou Erreur
    if (isSuccess) {
        form.style.display = 'none';
        if(introText) introText.style.display = 'none';
        if(noteText) noteText.style.display = 'none';
        
        // Personnalisation du message de succès
        const successNameEl = document.getElementById('success-name');
        if(successNameEl) successNameEl.innerText = firstName;
        
        successMsg.style.display = 'block';
    } else {
        alert("Une erreur technique est survenue. Veuillez vérifier votre connexion internet et réessayer.");
        // Restauration du bouton en cas d'erreur
        btn.disabled = false;
        btn.style.opacity = "1";
        btnText.innerText = "ENVOYER MON PLAN DÉTAILLÉ (PDF)";
        btnLoader.style.display = "none";
    }
}

window.onload = () => {
    updateSim();
    renderCatalogue();
};
