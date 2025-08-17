document.addEventListener('DOMContentLoaded', () => {
    const orderDetailsContainer = document.getElementById('orderDetails');
    const orderIdDisplay = document.getElementById('orderIdDisplay');
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
            orderIdNote: "Bitte bewahren Sie diese Nummer für Rückfragen auf."
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
            orderIdNote: "Please keep this ID for any inquiries."
        }
    };

    // Apply translations
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    const lastOrder = JSON.parse(localStorage.getItem('lastOrder'));

    if (lastOrder && orderIdDisplay) {
        // Display the Order ID
        orderIdDisplay.textContent = lastOrder.orderId || 'N/A';
    }

    if (lastOrder && orderDetailsContainer) {
        const { orderId, name, phone, pickupDate, pickupTime, cart } = lastOrder;
        const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2);

        const cartSummaryHTML = cart.map(item =>
            `<div class="summary-cart-item">
                <span>${item.quantity} x ${lang === 'de' ? item.product.name_de : item.product.name_en}</span>
                <span>(${(item.product.price * item.quantity).toFixed(2)} €)</span>
            </div>`
        ).join('');

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

    // Clear the cart and order details from local storage after displaying them
    localStorage.removeItem('cart');
    localStorage.removeItem('lastOrder');
});