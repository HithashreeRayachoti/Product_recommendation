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
        ,
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

                // Collect user-selected answers
                let userChoices = {};
                document.querySelectorAll("#questionsContainer select").forEach(select => {
                    userChoices[select.name] = select.value;
                });

                // Score products based on how well they match user choices
                filteredProducts.forEach(product => {
                    product.score = 0;

                    if (userChoices["whatisyourbudget"] && product.priceRange === userChoices["whatisyourbudget"]) {
                        product.score += 2; // Higher weight for budget match
                    }
                    if (userChoices["howmuchramdoyouneed"] && product.ram === userChoices["howmuchramdoyouneed"]) {
                        product.score += 1;
                    }
                    if (userChoices["doyoupreferwindowsormacos"] && product.os === userChoices["doyoupreferwindowsormacos"]) {
                        product.score += 1;
                    }
                    if (userChoices["howimportantisbatterylifetoyou"] && product.batteryLife === userChoices["howimportantisbatterylifetoyou"]) {
                        product.score += 1;
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
