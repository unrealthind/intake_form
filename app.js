// --- Google Maps Initialization (No changes) ---
let map, marker, geocoder;
async function initAutocomplete(){const addressInput=document.getElementById("project-address"),edmonton={lat:53.5461,lng:-113.4938};map=new google.maps.Map(document.getElementById("map"),{center:edmonton,zoom:11,mapId:"RAAVI_MAP_ID",mapTypeControl:!1});const{AdvancedMarkerElement:e}=await google.maps.importLibrary("marker");geocoder=new google.maps.Geocoder();const o=new google.maps.places.Autocomplete(addressInput,{fields:["formatted_address","geometry"]});o.addListener("place_changed",()=>{const t=o.getPlace();t.geometry&&t.geometry.location&&(map.setCenter(t.geometry.location),map.setZoom(17),placeMarker(t.geometry.location,e))}),map.addListener("click",o=>{placeMarker(o.latLng,e),geocoder.geocode({location:o.latLng},(e,o)=>{o==="OK"&&e[0]&&(addressInput.value=e[0].formatted_address)})})}function placeMarker(e,o){marker&&(marker.position=null),marker=new o({position:e,map:map})}

// --- App Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Card and Button Selectors ---
    const welcomeCard = document.getElementById('welcome-card');
    const formCard = document.getElementById('form-card');
    const thankyouCard = document.getElementById('thankyou-card');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const themeSwitcherBtn = document.getElementById('theme-switcher');

    // --- View Manager ---
    const showCard = (cardToShow) => {
        [welcomeCard, formCard, thankyouCard].forEach(card => card.classList.remove('active'));
        cardToShow.classList.add('active');
    };

    startBtn.addEventListener('click', () => showCard(formCard));
    restartBtn.addEventListener('click', () => {
        document.getElementById('intake-form').reset();
        currentStep = 0; // Reset form step
        updateFormSteps();
        showCard(welcomeCard);
    });

    // --- Theme Switcher Logic ---
    const themes = ['theme-rainbow', 'theme-dark-mono'];
    let currentTheme = localStorage.getItem('formTheme') || themes[0];
    const applyTheme = (theme) => {
        document.body.className = theme;
        localStorage.setItem('formTheme', theme);
    };
    themeSwitcherBtn.addEventListener('click', () => {
        const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
        currentTheme = themes[nextIndex];
        applyTheme(currentTheme);
    });
    applyTheme(currentTheme); // Apply saved theme on load

    // --- Multi-Step Form Logic ---
    const intakeForm = document.getElementById('intake-form');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const formSteps = [...document.querySelectorAll('.form-step')];
    const progressBar = document.getElementById('progress-bar');
    const formTitle = document.getElementById('form-title');
    let currentStep = 0;
    const titles = ["Client Information", "Project Location", "Services & Plans", "Final Details"];

    const updateFormSteps = () => {
        formTitle.textContent = titles[currentStep];
        progressBar.style.width = `${((currentStep + 1) / formSteps.length) * 100}%`;
        formSteps.forEach((step, index) => step.classList.toggle('active', index === currentStep));
        prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-block';
        nextBtn.textContent = currentStep === formSteps.length - 1 ? 'Submit' : 'Next';
    };

    const validateStep = () => {
        const inputs = [...formSteps[currentStep].querySelectorAll('input[required]')];
        let isValid = true;
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = 'rgba(239, 68, 68, 0.7)';
                isValid = false;
            } else {
                input.style.borderColor = '';
            }
        });
        return isValid;
    };

    nextBtn.addEventListener('click', () => {
        if (validateStep()) {
            if (currentStep < formSteps.length - 1) {
                currentStep++;
                updateFormSteps();
            } else {
                intakeForm.requestSubmit();
            }
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            updateFormSteps();
        }
    });

    intakeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(intakeForm);
        const data = Object.fromEntries(formData.entries());
        data.uploaded_file = document.getElementById('file-upload').files[0]?.name || 'No file uploaded';
        const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
        inquiries.push(data);
        localStorage.setItem('inquiries', JSON.stringify(inquiries));
        showCard(thankyouCard); // Show Thank You card on submit
    });
    
    updateFormSteps(); // Initial setup
});