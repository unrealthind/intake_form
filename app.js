// --- Google Maps Initialization (No changes) ---
let map, marker, geocoder;
async function initAutocomplete() {
    const addressInput = document.getElementById("project-address");
    const edmonton = { lat: 53.5461, lng: -113.4938 };
    map = new google.maps.Map(document.getElementById("map"), {
        center: edmonton,
        zoom: 11,
        mapId: "RAAVI_MAP_ID",
        mapTypeControl: false
    });
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    geocoder = new google.maps.Geocoder();
    const autocomplete = new google.maps.places.Autocomplete(addressInput, {
        fields: ["formatted_address", "geometry"]
    });
    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
            placeMarker(place.geometry.location, AdvancedMarkerElement);
        }
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

function placeMarker(position, AdvancedMarkerElement) {
    if (marker) {
        marker.position = null;
    }
    marker = new AdvancedMarkerElement({ position, map });
}

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
        handleFileUpload(); // Reset file upload UI
        handleProjectTypeChange(); // Reset dynamic categories
        resetCustomSelects(); // Reset custom dropdowns
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
    applyTheme(currentTheme);

    // --- Multi-Step Form Logic ---
    const intakeForm = document.getElementById('intake-form');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const formSteps = [...document.querySelectorAll('.form-step')];
    const progressBar = document.getElementById('progress-bar');
    const formTitle = document.getElementById('form-title');
    let currentStep = 0;
    const titles = ["Your Information", "Project Location", "Services & Plans", "Final Details"];

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
        
        const fileInput = document.getElementById('file-upload');
        const fileNames = [...fileInput.files].map(file => file.name);
        data.uploaded_files = fileNames.length > 0 ? fileNames : 'No files uploaded';
        
        const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
        inquiries.push(data);
        localStorage.setItem('inquiries', JSON.stringify(inquiries));
        showCard(thankyouCard);
    });
    
    // --- File Upload Logic ---
    const fileUpload = document.getElementById('file-upload');
    const fileListContainer = document.getElementById('file-list-container');
    const fileSizeError = document.getElementById('file-size-error');
    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB in bytes

    const handleFileUpload = () => {
        const files = [...fileUpload.files];
        let totalSize = 0;
        fileListContainer.innerHTML = ''; 
        if (files.length === 0) {
            fileSizeError.style.display = 'none';
            nextBtn.disabled = false;
            return;
        }
        const fileList = document.createElement('ul');
        fileList.className = 'list-disc list-inside';
        files.forEach(file => {
            totalSize += file.size;
            const listItem = document.createElement('li');
            listItem.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            fileList.appendChild(listItem);
        });
        fileListContainer.appendChild(fileList);
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        const totalSizeP = document.createElement('p');
        totalSizeP.className = 'font-bold mt-2';
        totalSizeP.textContent = `Total Size: ${totalSizeMB} MB`;
        fileListContainer.appendChild(totalSizeP);
        if (totalSize > MAX_SIZE) {
            fileSizeError.style.display = 'block';
            nextBtn.disabled = true;
        } else {
            fileSizeError.style.display = 'none';
            nextBtn.disabled = false;
        }
    };

    fileUpload.addEventListener('change', handleFileUpload);

    // --- Dynamic Category Logic ---
    const projectTypeRadios = document.querySelectorAll('input[name="project-type"]');
    const commercialCategories = document.getElementById('commercial-categories');
    const residentialCategories = document.getElementById('residential-categories');

    const handleProjectTypeChange = () => {
        const selectedType = document.querySelector('input[name="project-type"]:checked').value;
        
        if (selectedType === 'Commercial') {
            commercialCategories.classList.remove('hidden');
            residentialCategories.classList.add('hidden');
        } else if (selectedType === 'Residential') {
            commercialCategories.classList.add('hidden');
            residentialCategories.classList.remove('hidden');
        } else { // Rezoning
            commercialCategories.classList.add('hidden');
            residentialCategories.classList.add('hidden');
        }
    };

    projectTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleProjectTypeChange);
    });

    // --- Custom Select Logic ---
    const customSelects = document.querySelectorAll('.custom-select-wrapper');

    customSelects.forEach(wrapper => {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const select = wrapper.querySelector('.custom-select');
        const options = wrapper.querySelectorAll('.custom-option');
        const hiddenInput = wrapper.querySelector('input[type="hidden"]');
        const displaySpan = trigger.querySelector('span');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllSelects(select);
            select.classList.toggle('open');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                // Update hidden input and display
                hiddenInput.value = option.dataset.value;
                displaySpan.textContent = option.textContent;
                
                // Update selected class
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    });
    
    const closeAllSelects = (exceptThisOne = null) => {
        document.querySelectorAll('.custom-select').forEach(select => {
            if (select !== exceptThisOne) {
                select.classList.remove('open');
            }
        });
    };

    window.addEventListener('click', () => {
        closeAllSelects();
    });

    const resetCustomSelects = () => {
        customSelects.forEach(wrapper => {
            const hiddenInput = wrapper.querySelector('input[type="hidden"]');
            const displaySpan = wrapper.querySelector('.custom-select-trigger span');
            const options = wrapper.querySelectorAll('.custom-option');
            
            hiddenInput.value = '';
            displaySpan.textContent = '— Please Select —';
            
            options.forEach(opt => opt.classList.remove('selected'));
            
            // For sq ft/m, reset to default
            if (hiddenInput.name === 'area-unit') {
                hiddenInput.value = 'sq ft';
                displaySpan.textContent = 'sq ft';
                wrapper.querySelector('.custom-option[data-value="sq ft"]').classList.add('selected');
            }
        });
    };
    
    // Initial setup
    updateFormSteps(); 
    handleProjectTypeChange(); // Set initial category visibility
});