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

// --- Multi-Step Form Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const intakeForm = document.getElementById('intake-form');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const formSteps = [...document.querySelectorAll('.form-step')];
    const progressBar = document.getElementById('progress-bar');
    const formTitle = document.getElementById('form-title');

    let currentStep = 0;
    const titles = ["Client Information", "Project Location", "Services & Plans", "Final Details"];

    const updateFormSteps = () => {
        // Update Title and Progress Bar
        formTitle.textContent = titles[currentStep];
        const progress = `${((currentStep + 1) / formSteps.length) * 100}%`;
        progressBar.style.width = progress;

        // Show/Hide Steps
        formSteps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });

        // Update Button States
        prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-block';
        nextBtn.textContent = currentStep === formSteps.length - 1 ? 'Submit' : 'Next';
    };

    const validateStep = () => {
        const currentStepElement = formSteps[currentStep];
        const inputs = [...currentStepElement.querySelectorAll('input[required], textarea[required]')];
        let isValid = true;
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = 'rgba(239, 68, 68, 0.7)'; // Red border for invalid
                isValid = false;
            } else {
                input.style.borderColor = ''; // Reset border
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
                // Last step: submit the form
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
        
        // Handle file name specifically
        const fileInput = document.getElementById('file-upload');
        data.uploaded_file = fileInput.files[0] ? fileInput.files[0].name : 'No file uploaded';

        // Save to local storage
        const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
        inquiries.push(data);
        localStorage.setItem('inquiries', JSON.stringify(inquiries));

        // Redirect
        window.location.href = 'thankyou.html';
    });

    // Initial setup
    updateFormSteps();
});