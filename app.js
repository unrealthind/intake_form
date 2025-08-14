// --- Google Maps Initialization ---
let map, marker, geocoder;
async function initAutocomplete() {
    const addressInput = document.getElementById("project-address");
    if (!addressInput) return; // Exit if map was disabled

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
    const intakeForm = document.getElementById('intake-form');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');

    // --- View Manager ---
    const showCard = (cardToShow) => {
        [welcomeCard, formCard, thankyouCard].forEach(card => card.classList.remove('active'));
        cardToShow.classList.add('active');
    };

    startBtn.addEventListener('click', () => showCard(formCard));
    restartBtn.addEventListener('click', () => {
        intakeForm.reset();
        currentStep = 0;
        updateFormSteps();
        handleFileUpload();
        handleProjectTypeChange();
        resetCustomSelects();
        showCard(welcomeCard);
    });

    // --- Theme Switcher Logic ---
    const themes = ['theme-rainbow', 'theme-dark-mono'];
    let currentTheme = localStorage.getItem('formTheme') || themes[0];
    
    const applyTheme = (theme) => {
        document.body.className = theme;
        localStorage.setItem('formTheme', theme);
        const buttonsToTheme = [startBtn, nextBtn, restartBtn];
        if (theme === 'theme-rainbow') {
            buttonsToTheme.forEach(btn => btn.style.color = '#6d28d9');
        } else {
            buttonsToTheme.forEach(btn => btn.style.color = '#374151');
        }
    };
    
    themeSwitcherBtn.addEventListener('click', () => {
        const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
        currentTheme = themes[nextIndex];
        applyTheme(currentTheme);
    });
    applyTheme(currentTheme);

    // --- Multi-Step Form Logic ---
    const formSteps = [...document.querySelectorAll('.form-step')];
    const progressBar = document.getElementById('progress-bar');
    const formTitle = document.getElementById('form-title');
    let currentStep = 0;
    const titles = ["Your Information", "Project Location", "Services & Plans", "Final Details"];

    const updateFormSteps = () => {
        formTitle.textContent = titles[currentStep];
        progressBar.style.width = `${((currentStep + 1) / formSteps.length) * 100}%`;
        formSteps.forEach((s, index) => s.classList.toggle('active', index === currentStep));
        prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-block';
        nextBtn.textContent = currentStep === formSteps.length - 1 ? 'Submit' : 'Next';
    };

    // --- Validation Logic ---
    const showError = (element, message) => {
        element.classList.add('error');
        if (element.tagName === 'INPUT') {
            element.placeholder = message;
        }
        const wrapper = element.closest('.form-group, .custom-select-wrapper');
        const inputElement = wrapper.querySelector('.custom-select, .glass-input');
        if (inputElement) {
            inputElement.style.borderColor = 'rgba(239, 68, 68, 0.7)';
        }
    };

    const clearError = (element) => {
        element.classList.remove('error');
        if (element.tagName === 'INPUT') {
            element.placeholder = element.dataset.placeholder || '';
        }
         const wrapper = element.closest('.form-group, .custom-select-wrapper');
        const inputElement = wrapper.querySelector('.custom-select, .glass-input');
        if (inputElement) {
            inputElement.style.borderColor = '';
        }
    };

    const validateStep = (stepIndex) => {
        let isValid = true;
        const currentStepFields = formSteps[stepIndex].querySelectorAll('[required], .custom-select');
        currentStepFields.forEach(el => clearError(el));

        if (stepIndex === 0) {
            const name = document.getElementById('client-name');
            const company = document.getElementById('client-company');
            const phone = document.getElementById('phone-number');
            const email = document.getElementById('email-address');

            if (!name.value.trim()) { showError(name, 'REQUIRED'); isValid = false; }
            if (!company.value.trim()) { showError(company, 'REQUIRED'); isValid = false; }
            
            const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            if (!phone.value.trim()) { showError(phone, 'REQUIRED'); isValid = false; }
            else if (!phone.value.match(phoneRegex)) { showError(phone, 'INVALID FORMAT'); isValid = false; }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.value.trim()) { showError(email, 'REQUIRED'); isValid = false; }
            else if (!email.value.match(emailRegex)) { showError(email, 'INVALID FORMAT'); isValid = false; }
        }

        if (stepIndex === 1) {
            const address = document.getElementById('project-address');
            if (!address.value.trim()) { showError(address, 'REQUIRED'); isValid = false; }
        }

        if (stepIndex === 2) {
            const selectedType = document.querySelector('input[name="project-type"]:checked').value;
            let categoryInput;
            if (selectedType === 'Commercial') {
                categoryInput = document.querySelector('input[name="commercial-category"]');
            } else if (selectedType === 'Residential') {
                categoryInput = document.querySelector('input[name="residential-category"]');
            } else if (selectedType === 'Rezoning') {
                categoryInput = document.querySelector('input[name="rezoning-category"]');
            }

            if (categoryInput && !categoryInput.value) {
                const customSelectElement = categoryInput.closest('.custom-select-wrapper').querySelector('.custom-select');
                showError(customSelectElement, 'Please select a category.');
                isValid = false;
            }
        }
        // No validation needed for step 3 as no fields are required.
        return isValid;
    };

    document.querySelectorAll('.glass-input[required]').forEach(input => {
        input.addEventListener('input', () => clearError(input));
    });

    // --- THIS IS THE PRIMARY FIX ---
    nextBtn.addEventListener('click', () => {
        // First, validate the step the user is currently on.
        if (validateStep(currentStep)) {
            // If the step is valid, check if it's the last one.
            if (currentStep < formSteps.length - 1) {
                // If it's NOT the last step, simply move to the next one.
                currentStep++;
                updateFormSteps();
            } else {
                // If it IS the last step and it's valid, submit the form.
                const formData = new FormData(intakeForm);
                const data = Object.fromEntries(formData.entries());
                
                const fileInput = document.getElementById('file-upload');
                const fileNames = [...fileInput.files].map(file => file.name);
                data.uploaded_files = fileNames.length > 0 ? fileNames : 'No files uploaded';
                
                const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
                inquiries.push(data);
                localStorage.setItem('inquiries', JSON.stringify(inquiries));
                
                showCard(thankyouCard);
            }
        }
        // If validateStep(currentStep) returns false, errors will be shown and nothing else will happen.
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            updateFormSteps();
        }
    });
    
    // --- File Upload Logic ---
    const fileUpload = document.getElementById('file-upload');
    const fileListContainer = document.getElementById('file-list-container');
    const fileSizeError = document.getElementById('file-size-error');
    const MAX_SIZE = 100 * 1024 * 1024;

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
    const rezoningCategories = document.getElementById('rezoning-categories');

    const handleProjectTypeChange = () => {
        const selectedType = document.querySelector('input[name="project-type"]:checked').value;
        
        commercialCategories.classList.add('hidden');
        residentialCategories.classList.add('hidden');
        rezoningCategories.classList.add('hidden');

        if (selectedType === 'Commercial') {
            commercialCategories.classList.remove('hidden');
        } else if (selectedType === 'Residential') {
            residentialCategories.classList.remove('hidden');
        } else if (selectedType === 'Rezoning') {
            rezoningCategories.classList.remove('hidden');
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
                hiddenInput.value = option.dataset.value;
                displaySpan.innerHTML = option.innerHTML;
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                clearError(select);
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
            
            if (hiddenInput.name === 'area-unit') {
                hiddenInput.value = 'sq ft';
                displaySpan.innerHTML = 'ft<sup>2</sup>';
                wrapper.querySelector('.custom-option[data-value="sq ft"]').classList.add('selected');
            }
        });
    };
    
    // --- Date Picker Icon Logic ---
    const datePickerIcon = document.getElementById('date-picker-icon');
    const dateInput = document.getElementById('lease-possession-date');

    datePickerIcon.addEventListener('click', () => {
        try {
            dateInput.showPicker();
        } catch (e) {
            console.error("Browser does not support showPicker().");
        }
    });
    
    // Initial setup
    updateFormSteps(); 
    handleProjectTypeChange();
});