document.addEventListener('DOMContentLoaded', () => {
    const orderDetailsContainer = document.getElementById('orderDetails');
    const orderIdDisplay = document.getElementById('orderIdDisplay');
    const printBtn = document.getElementById('printBtn');
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

    // Apply translations
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        if (translations[lang][key]) {
            const target = el.querySelector('span') || el;
            target.textContent = translations[lang][key];
        }
    });

    const lastOrder = JSON.parse(localStorage.getItem('lastOrder'));

    if (lastOrder && orderIdDisplay) {
        orderIdDisplay.textContent = lastOrder.orderId || 'N/A';
    }

    if (lastOrder && orderDetailsContainer) {
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

            return `<div class="summary-cart-item">
                        <span>${displayQuantity} x ${lang === 'de' ? item.product.name_de : item.product.name_en}</span>
                        <span>(${itemPrice.toFixed(2)} €)</span>
                    </div>`;
        }).join('');

        orderDetailsContainer.innerHTML = `
            <div class="summary-section">
                <h3>${translations[lang].pickupDetails}</h3>
                <p><strong>${translations[lang].name}:</strong> ${name || translations[lang].notProvided}</p>
                <p><strong>${translations[lang].phone}:</strong> ${phone || translations[lang].notProvided}</p>
                <p><strong>${translations[lang].pickupDateTime}:</strong> ${pickupDate} um ${pickupTime}:00 Uhr</p>
            </div>
            <div class="summary-section">
                <h3>${translations[lang].yourOrder}</h3>
                ${cartSummaryHTML}
                <div class="summary-total">
                    <strong>${translations[lang].total}:</strong>
                    <strong>${total} €</strong>
                </div>
            </div>
        `;
    } else if (orderDetailsContainer) {
        orderDetailsContainer.innerHTML = `<p>Keine Bestelldetails gefunden.</p>`;
    }
    
    if(printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // NEW LOGIC: Save to history, then clear cart and temporary order
    if (lastOrder) {
        let pastOrders = JSON.parse(localStorage.getItem('pastOrders')) || [];
        pastOrders.unshift(lastOrder); // Add the new order to the beginning of the list
        if (pastOrders.length > 5) { // Keep only the last 5 orders
            pastOrders.pop();
        }
        localStorage.setItem('pastOrders', JSON.stringify(pastOrders));
    }

    // Clear the cart and the temporary order details from local storage
    localStorage.removeItem('cart');
    localStorage.removeItem('lastOrder');
});
