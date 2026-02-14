document.addEventListener("DOMContentLoaded", function () {
    const productType = document.getElementById("productType");
    const questionsContainer = document.getElementById("questionsContainer");
    const findMatchButton = document.getElementById("findMatch");
    const resultsContainer = document.getElementById("resultsContainer");

    const questions = {
        phone: [
            { question: "What is your budget?", type: "dropdown", options: ["< $300", "$300 - $600", "$600 - $1000", "$1000+"] },
            { question: "How many years do you plan to use this phone?", type: "dropdown", options: ["1-2 years", "3-4 years", "5+ years"] },
            { question: "What is your top priority?", type: "dropdown", options: ["Camera", "Battery", "Display", "Performance"] },
            { question: "Do you need 5G support?", type: "dropdown", options: ["Yes", "No"] },
            { question: "How much storage do you need?", type: "dropdown", options: ["64GB", "128GB", "256GB", "512GB+"] }
        ],
        laptop: [
            { question: "What is your budget?", type: "dropdown", options: ["< $500", "$500 - $1000", "$1000 - $1500", "$1500+"] },
            { question: "What will you use the laptop for?", type: "dropdown", options: ["Gaming", "Work", "School", "Video Editing"] },
            { question: "What is your preferred screen size?", type: "dropdown", options: ["13-inch", "15-inch", "17-inch", "No Preference"] },
            { question: "How much RAM do you need?", type: "dropdown", options: ["8GB", "16GB", "32GB", "64GB+"] },
            { question: "How important is battery life to you?", type: "dropdown", options: ["Very Important", "Moderate", "Not Important"] }
        ],
        smartwatch: [
            { question: "What is your budget?", type: "dropdown", options: ["< $100", "$100 - $300", "$300 - $600", "$600+"] },
            { question: "What is your main use case?", type: "dropdown", options: ["Fitness", "Notifications", "Calls", "All of the above"] },
            { question: "Do you need GPS?", type: "dropdown", options: ["Yes", "No"] },
            { question: "Do you prefer a round or square display?", type: "dropdown", options: ["Round", "Square", "No Preference"] },
            { question: "How long should the battery last?", type: "dropdown", options: ["1 day", "2-3 days", "1 week", "No Preference"] },
            { question: "Do you want LTE connectivity?", type: "dropdown", options: ["Yes", "No"] }
        ]
    };

    function updateQuestions() {
        questionsContainer.innerHTML = "";
        const selectedProduct = productType.value;

        questions[selectedProduct].forEach(({ question, type, options }) => {
            const label = document.createElement("label");
            label.textContent = question;

            if (type === "dropdown") {
                const select = document.createElement("select");
                select.name = question.replace(/\s+/g, "").toLowerCase();

                options.forEach(option => {
                    const optionElement = document.createElement("option");
                    optionElement.value = option;
                    optionElement.textContent = option;
                    select.appendChild(optionElement);
                });

                questionsContainer.appendChild(label);
                questionsContainer.appendChild(select);
            }
        });
    }

    findMatchButton.addEventListener("click", function () {
        resultsContainer.innerHTML = "<p>Finding the best match...</p>";

        fetch("products.json")
            .then(response => response.json())
            .then(data => {
                const selectedCategory = productType.value;
                let filteredProducts = data.products.filter(p => p.category === selectedCategory);

                if (filteredProducts.length === 0) {
                    resultsContainer.innerHTML = "<p>No products found in this category.</p>";
                    return;
                }

                // Collect user-selected answers (key = question text with no spaces, lowercased)
                let userChoices = {};
                document.querySelectorAll("#questionsContainer select").forEach(select => {
                    userChoices[select.name] = select.value;
                });

                // Helper: check if product price falls within user's budget range
                function priceInBudget(price, budgetOption, category) {
                    if (!budgetOption) return false;
                    const ranges = {
                        phone: { "< $300": [0, 300], "$300 - $600": [300, 600], "$600 - $1000": [600, 1000], "$1000+": [1000, Infinity] },
                        laptop: { "< $500": [0, 500], "$500 - $1000": [500, 1000], "$1000 - $1500": [1000, 1500], "$1500+": [1500, Infinity] },
                        smartwatch: { "< $100": [0, 100], "$100 - $300": [100, 300], "$300 - $600": [300, 600], "$600+": [600, Infinity] }
                    };
                    const range = ranges[category] && ranges[category][budgetOption];
                    if (!range) return false;
                    return price >= range[0] && price <= range[1];
                }

                // Score products based on how well they match user choices (category-specific)
                filteredProducts.forEach(product => {
                    product.score = 0;

                    // Budget match (all categories) – products have "price", not "priceRange"
                    if (priceInBudget(product.price, userChoices["whatisyourbudget"], selectedCategory)) {
                        product.score += 2;
                    }

                    if (selectedCategory === "phone") {
                        // Priority: Camera, Battery, Display, Performance – products have priority[] e.g. ["camera","battery"]
                        const priority = userChoices["whatisyourtoppriority"];
                        if (priority && product.priority) {
                            const want = priority.toLowerCase();
                            if (product.priority.some(p => p.toLowerCase() === want)) product.score += 2;
                        }
                        // Storage – product has "storage" e.g. "128GB", "256GB"
                        const wantStorage = userChoices["howmuchstoragedoyouneed"];
                        if (wantStorage && product.storage) {
                            if (product.storage === wantStorage) product.score += 1;
                            else if (wantStorage === "512GB+" && (product.storage === "512GB" || product.storage.startsWith("512"))) product.score += 1;
                        }
                    }

                    if (selectedCategory === "laptop") {
                        // Use case: Gaming, Work, School, Video Editing – products have priority[] e.g. ["gaming","performance"]
                        const useCase = userChoices["whatwillyouusethelaptopfor"];
                        if (useCase && product.priority) {
                            const want = useCase.toLowerCase().replace(" ", "");
                            if (product.priority.some(p => p.toLowerCase() === want)) product.score += 2;
                            if (useCase === "Video Editing" && product.priority.includes("performance")) product.score += 2;
                            if (useCase === "School" && (product.priority.includes("work") || product.priority.includes("battery"))) product.score += 1;
                        }
                        // RAM – product has "ram" e.g. "16GB"
                        if (userChoices["howmuchramdoyouneed"] && product.ram === userChoices["howmuchramdoyouneed"]) {
                            product.score += 1;
                        }
                        // Screen size – product has "screen_size" e.g. "15.6-inch OLED"
                        const wantSize = userChoices["whatisyourpreferredscreensize"];
                        if (wantSize && product.screen_size && wantSize !== "No Preference") {
                            if (product.screen_size.includes(wantSize.replace("-inch", ""))) product.score += 1;
                        }
                        // Battery importance – product has "battery_life" e.g. "20 hours"
                        const batteryImportance = userChoices["howimportantisbatterylifetoyou"];
                        if (batteryImportance === "Very Important" && product.battery_life) {
                            const hours = parseInt(product.battery_life, 10);
                            if (!isNaN(hours) && hours >= 15) product.score += 1;
                        }
                    }

                    if (selectedCategory === "smartwatch") {
                        // Use case: Fitness, Notifications, Calls, All of the above – products have priority[] e.g. ["health","notifications"]
                        const useCase = userChoices["whatisyourmainusecase"];
                        if (useCase && product.priority) {
                            if (useCase === "Fitness" && (product.priority.includes("fitness") || product.priority.includes("health"))) product.score += 2;
                            if (useCase === "Notifications" && product.priority.includes("notifications")) product.score += 2;
                            if (useCase === "All of the above") product.score += 1;
                        }
                        // GPS – product has features[] e.g. ["ECG","Blood Oxygen","GPS"]
                        if (userChoices["doyouneedgps"] === "Yes" && product.features && product.features.some(f => f.toUpperCase() === "GPS")) {
                            product.score += 1;
                        }
                        // LTE
                        if (userChoices["doyouwantlteconnectivity"] === "Yes" && product.features && product.features.some(f => f.toUpperCase() === "LTE")) {
                            product.score += 1;
                        }
                        // Battery length – product has "battery" e.g. "18 hours", "14 days"
                        const wantBattery = userChoices["howlongshouldthebatterylast"];
                        if (wantBattery && wantBattery !== "No Preference" && product.battery) {
                            if (wantBattery === "1 week" && product.battery.includes("days")) product.score += 1;
                            if (wantBattery === "2-3 days" && (product.battery.includes("days") || product.battery.includes("80"))) product.score += 1;
                            if (wantBattery === "1 day" && product.battery.includes("hours")) product.score += 1;
                        }
                    }
                });

                // Sort by highest score
                filteredProducts.sort((a, b) => b.score - a.score);

                // Pick the best match
                let bestMatch = filteredProducts[0];

                resultsContainer.innerHTML = "<h2>Recommended Product:</h2>";
                if (bestMatch) {
                    resultsContainer.innerHTML += `
                        <p><strong>${bestMatch.name}</strong> - $${bestMatch.price}</p>
                        <a href="${bestMatch.link}" target="_blank">View Product</a>
                    `;
                } else {
                    resultsContainer.innerHTML += "<p>No match found.</p>";
                }
            })
            .catch(error => {
                resultsContainer.innerHTML = "<p>Error loading products.</p>";
                console.error("Error:", error);
            });
    });

    productType.addEventListener("change", updateQuestions);
    updateQuestions();
});

// Function to display products in a category
function displayProducts(products) {
    let container = document.querySelector(".category-container"); 
    if (!container) return; // Prevent error if container doesn't exist

    products.forEach(product => {
        let productBox = document.createElement("div");
        productBox.classList.add("category-box");

        productBox.innerHTML = `
            <img src="images/${product.category}.png" alt="${product.name}">
            <p>${product.name} - $${product.price}</p>
            <a href="${product.link}" target="_blank">View Product</a>
        `;

        container.appendChild(productBox);
    });
}


// Sign-In and Sign-Up Toggle Logic
document.addEventListener("DOMContentLoaded", function () {
    const signInContainer = document.getElementById("signInContainer");
    const signUpContainer = document.getElementById("signUpContainer");
    const toggleSignIn = document.getElementById("toggleSignIn");
    const toggleSignUp = document.getElementById("toggleSignUp");

    function showSignIn() {
        signInContainer.classList.remove("hidden");
        signUpContainer.classList.add("hidden");
        toggleSignIn.classList.add("active");
        toggleSignUp.classList.remove("active");
    }

    function showSignUp() {
        signUpContainer.classList.remove("hidden");
        signInContainer.classList.add("hidden");
        toggleSignUp.classList.add("active");
        toggleSignIn.classList.remove("active");
    }

    toggleSignIn.addEventListener("click", showSignIn);
    toggleSignUp.addEventListener("click", showSignUp);
});
