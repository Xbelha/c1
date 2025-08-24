document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const orderDetailsContainer = document.getElementById('orderDetails');
    const orderIdDisplay = document.getElementById('orderIdDisplay');
    const printBtn = document.getElementById('printBtn');
    
    // --- STATE & TRANSLATIONS ---
    const lang = localStorage.getItem('bakeryLang') || 'de';
    const translations = {
        de: {
            thankYouTitle: "Vielen Dank!",
            thankYouSubtitle: "Ihre Bestellung wurde erfolgreich an uns übermittelt.",
            summaryTitle: "Bestellübersicht",
            pickupAddress: "Abholadresse:",
            anyQuestions: "Fragen zur Bestellung?",
            backToHome: "Zurück zur Startseite",
            pickupDetails: "Abholdetails",
            name: "Name",
            phone: "Telefon",
            pickupDateTime: "Abholzeitpunkt",
            yourOrder: "Ihre Bestellung",
            total: "Gesamt",
            notProvided: "Nicht angegeben",
            yourOrderId: "Ihre Bestellnummer:",
            orderIdNote: "Bitte bewahren Sie diese Nummer für Rückfragen auf.",
            printOrderText: "Bestellung drucken"
        },
        en: {
            thankYouTitle: "Thank You!",
            thankYouSubtitle: "Your order has been successfully submitted.",
            summaryTitle: "Order Summary",
            pickupAddress: "Pickup Address:",
            anyQuestions: "Questions about your order?",
            backToHome: "Back to Homepage",
            pickupDetails: "Pickup Details",
            name: "Name",
            phone: "Phone",
            pickupDateTime: "Pickup Time",
            yourOrder: "Your Order",
            total: "Total",
            notProvided: "Not provided",
            yourOrderId: "Your Order ID:",
            orderIdNote: "Please keep this ID for any inquiries.",
            printOrderText: "Print Order"
        }
    };

    // --- FUNCTIONS ---

    /**
     * Applies the correct language strings to the page elements.
     */
    function applyLanguage() {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            if (translations[lang][key]) {
                const target = el.querySelector('span') || el;
                target.textContent = translations[lang][key];
            }
        });
    }

    /**
     * Renders the details of the last placed order onto the page.
     */
    function renderOrderDetails() {
        const lastOrder = JSON.parse(localStorage.getItem('lastOrder'));

        if (orderIdDisplay && lastOrder) {
            orderIdDisplay.textContent = lastOrder.orderId || 'N/A';
        }

        if (orderDetailsContainer && lastOrder) {
            const { name, phone, pickupDate, pickupTime, cart } = lastOrder;
            
            const total = cart.reduce((sum, item) => {
                const pricePerItem = (item.size === 'half' && item.product.price_half) ? item.product.price_half : item.product.price;
                return sum + (pricePerItem * item.quantity);
            }, 0).toFixed(2);

            const cartSummaryHTML = cart.map(item => {
                let displayQuantity = item.quantity;
                if (item.size === 'half') {
                    displayQuantity = item.quantity * 0.5;
                }
                const pricePerItem = (item.size === 'half' && item.product.price_half) ? item.product.price_half : item.product.price;
                const itemPrice = pricePerItem * item.quantity;

                return `<div class="flex justify-between items-center text-gray-600">
                            <span>${displayQuantity} x ${lang === 'de' ? item.product.name_de : item.product.name_en}</span>
                            <span class="font-medium text-gray-700">${itemPrice.toFixed(2)} €</span>
                        </div>`;
            }).join('');

            orderDetailsContainer.innerHTML = `
                <div class="space-y-2">
                    <h3 class="font-semibold text-lg text-gray-800 border-b pb-2 mb-3">${translations[lang].pickupDetails}</h3>
                    <p class="flex justify-between">
                        <span class="text-gray-500">${translations[lang].name}:</span>
                        <span class="font-semibold text-gray-700">${name || translations[lang].notProvided}</span>
                    </p>
                    <p class="flex justify-between">
                        <span class="text-gray-500">${translations[lang].phone}:</span>
                        <span class="font-semibold text-gray-700">${phone || translations[lang].notProvided}</span>
                    </p>
                    <p class="flex justify-between">
                        <span class="text-gray-500">${translations[lang].pickupDateTime}:</span>
                        <span class="font-semibold text-gray-700">${pickupDate} Um ${pickupTime}:00</span>
                    </p>
                </div>
                <div class="space-y-2">
                    <h3 class="font-semibold text-lg text-gray-800 border-b pb-2 mb-3">${translations[lang].yourOrder}</h3>
                    <div class="space-y-1">${cartSummaryHTML}</div>
                    <div class="flex justify-between font-bold text-lg pt-3 border-t mt-3">
                        <span>${translations[lang].total}:</span>
                        <span>${total} €</span>
                    </div>
                </div>
            `;
        } else if (orderDetailsContainer) {
            orderDetailsContainer.innerHTML = `<p>Keine Bestelldetails gefunden.</p>`;
        }
    }

    /**
     * Saves the completed order to a persistent history and clears temporary data.
     */
    function finalizeOrder() {
        const lastOrder = JSON.parse(localStorage.getItem('lastOrder'));
        if (lastOrder) {
            let pastOrders = JSON.parse(localStorage.getItem('pastOrders')) || [];
            pastOrders.unshift(lastOrder); // Add to the beginning
            if (pastOrders.length > 5) { // Keep only the last 5 orders
                pastOrders.pop();
            }
            localStorage.setItem('pastOrders', JSON.stringify(pastOrders));
        }

        // Clean up cart and temporary order from local storage
        localStorage.removeItem('cart');
        localStorage.removeItem('lastOrder');
    }

    // --- INITIALIZATION & EVENT LISTENERS ---
    
    applyLanguage();
    renderOrderDetails();
    finalizeOrder();

    printBtn?.addEventListener('click', () => {
        window.print();
    });
});
