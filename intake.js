// --- Google Maps Initialization (No changes here) ---
let map;
let marker;
let geocoder;

async function initAutocomplete() {
    const addressInput = document.getElementById('project-address');
    const edmonton = { lat: 53.5461, lng: -113.4938 };
    map = new google.maps.Map(document.getElementById("map"), {
        center: edmonton,
        zoom: 11,
        mapId: "RAAVI_MAP_ID",
        mapTypeControl: false,
    });
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    geocoder = new google.maps.Geocoder();
    const autocomplete = new google.maps.places.Autocomplete(addressInput, { fields: ["formatted_address", "geometry"] });
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) { return; }
        map.setCenter(place.geometry.location);
        map.setZoom(17);
        placeMarker(place.geometry.location, AdvancedMarkerElement);
    });
    map.addListener("click", (e) => {
        placeMarker(e.latLng, AdvancedMarkerElement);
        geocoder.geocode({ location: e.latLng }, (results, status) => {
            if (status === "OK" && results[0]) {
                addressInput.value = results[0].formatted_address;
            }
        });
    });
}
function placeMarker(location, AdvancedMarkerElement) {
    if (marker) { marker.position = null; }
    marker = new AdvancedMarkerElement({ position: location, map: map });
}

// --- App Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Switcher Logic ---
    const themeSwitcherBtn = document.getElementById('theme-switcher');
    const themes = ['theme-rainbow', 'theme-dark-mono'];
    let currentTheme = localStorage.getItem('formTheme') || themes[0];

    const applyTheme = (theme) => {
        document.body.className = theme;
        localStorage.setItem('formTheme', theme);
    };

    themeSwitcherBtn.addEventListener('click', () => {
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        currentTheme = themes[nextIndex];
        applyTheme(currentTheme);
    });

    // Apply saved theme on initial load
    applyTheme(currentTheme);


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
        const progress = `${((currentStep + 1) / formSteps.length) * 100}%`;
        progressBar.style.width = progress;
        formSteps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });
        prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-block';
        nextBtn.textContent = currentStep === formSteps.length - 1 ? 'Submit' : 'Next';
    };

    const validateStep = () => {
        const currentStepElement = formSteps[currentStep];
        const inputs = [...currentStepElement.querySelectorAll('input[required], textarea[required]')];
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
        const fileInput = document.getElementById('file-upload');
        data.uploaded_file = fileInput.files[0] ? fileInput.files[0].name : 'No file uploaded';
        const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
        inquiries.push(data);
        localStorage.setItem('inquiries', JSON.stringify(inquiries));
        window.location.href = 'thankyou.html';
    });

    updateFormSteps();
});