// --- FULL SCRIPT ---

// --- STATE MANAGEMENT ---
let products = [];
let currentLang = localStorage.getItem('bakeryLang') || 'de';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = new Set(JSON.parse(localStorage.getItem('bakeryFavorites')) || []);
let pastOrders = JSON.parse(localStorage.getItem('pastOrders')) || [];
let currentProductInModal = null;
let currentPage = 1;
const productsPerPage = 12;
let currentFilteredProducts = [];
let deferredInstallPrompt = null;

// --- DOM ELEMENT REFERENCES ---
const modal = document.getElementById('modal');
const orderModal = document.getElementById('orderModal');
const orderHistoryModal = document.getElementById('orderHistoryModal');
const productGrid = document.getElementById('productGrid');
const cartCountSpan = document.getElementById('cartCount');
const pickupDateInput = document.getElementById('pickupDate');
const pickupTimeSelect = document.getElementById('pickupTime');
const paginationContainer = document.getElementById('paginationContainer');
const installAppBtn = document.getElementById('installAppBtn');
const cartView = document.getElementById('cartView');
const formView = document.getElementById('formView');
const orderNowLink = document.getElementById('orderNowLink');
const orderHistoryBtn = document.getElementById('orderHistoryBtn');

// --- TRANSLATIONS ---
const translations = {
    de: {
        langSwitch: 'Sprache ändern', mainTitle: 'Macis Biobäckerei in Leipzig', subTitle: 'Traditionelle Backkunst, jeden Tag frisch',
        orderNowBtn: 'Jetzt bestellen', allBakedGoods: 'Alle Backwaren', bread: 'Brot', rolls: 'Brötchen', sweets: 'Süßes', searchBtn: 'Suche',
        holidaySpecials: 'Sonn- & Feiertags', favorites: 'Favoriten',
        orderTitle: 'Deine Bestellung', submitBtn: 'Absenden', contactTitle: 'Kontakt & Öffnungszeiten', addressLabel: 'Adresse:', phoneLabel: 'Telefon:', emailLabel: 'E-Mail:',
        openingHoursTitle: 'Öffnungszeiten', openingHoursWeekday: 'Montag – Samstag: 7:00 – 19:00 Uhr', openingHoursSunday: 'Sonntag: 8:00 – 12:00 Uhr',
        noProductsAddedAlert: 'Dein Warenkorb ist leer.',
        orderSuccessAlert: 'Vielen Dank für deine Bestellung! Wir haben sie erhalten.',
        pickupDateLabel: 'Abholdatum:', pickupTimeLabel: 'Abholzeit:',
        addToCartBtn: 'Zum Warenkorb', yourCart: 'Dein Warenkorb', searchPlaceholder: 'Gib ein, was du suchst...', yourName: 'Dein Name', phoneNumber: 'Telefonnummer',
        emailOptional: 'E-Mail (optional)', messageOptional: 'Nachricht (optional)',
        totalText: 'Gesamt:', prevPage: 'Zurück', nextPage: 'Weiter',
        holidayProductOnNonHolidayAlert: 'Ihre Bestellung enthält Artikel, die nur an Sonn- und Feiertagen erhältlich sind. Bitte wählen Sie einen entsprechenden Tag als Abholdatum.',
        phoneHint: "Bitte nur Zahlen, Leerzeichen oder '+' eingeben.",
        slicingSliced: "Geschnitten", sizeHalf: "Halbes",
        ingredientsTitle: "Zutaten & Allergene", nutritionTitle: "Nährwertangaben", viewDetailsBtn: "Details ansehen",
        installApp: "App installieren", addedToFavorites: 'Zu Favoriten hinzugefügt', removedFromFavorites: 'Aus Favoriten entfernt',
        addedToCartMessage: 'hinzugefügt',
        myOrdersBtnTitle: 'Meine Bestellungen', orderHistoryTitle: 'Bestellverlauf', noPastOrders: 'Keine früheren Bestellungen gefunden.',
        reorderBtn: 'Erneut bestellen', orderOn: 'Bestellung vom', detailsBtn: 'Details',
    },
    en: {
        langSwitch: 'Change Language', mainTitle: 'Macis Organic Bakery in Leipzig', subTitle: 'Traditional Baking, Fresh Every Day',
        orderNowBtn: 'Order Now', allBakedGoods: 'All Baked Goods', bread: 'Bread', rolls: 'Rolls', sweets: 'Sweets', searchBtn: 'Search',
        holidaySpecials: 'Sundays & Holidays', favorites: 'Favorites',
        orderTitle: 'Your Order', submitBtn: 'Submit', contactTitle: 'Contact & Opening Hours', addressLabel: 'Address:', phoneLabel: 'Phone:', emailLabel: 'Email:',
        openingHoursTitle: 'Opening Hours', openingHoursWeekday: 'Monday – Saturday: 7:00 AM – 7:00 PM', openingHoursSunday: 'Sunday: 8:00 AM – 12:00 PM',
        noProductsAddedAlert: 'Your cart is empty.',
        orderSuccessAlert: 'Thank you for your order! We have received it.',
        pickupDateLabel: 'Pickup Date:', pickupTimeLabel: 'Pickup Time:',
        addToCartBtn: 'Add to Cart', yourCart: 'Your Cart', searchPlaceholder: 'Enter what you are looking for...', yourName: 'Your Name', phoneNumber: 'Phone Number',
        emailOptional: 'Email (optional)', messageOptional: 'Message (optional)',
        totalText: 'Total:', prevPage: 'Previous', nextPage: 'Next',
        holidayProductOnNonHolidayAlert: 'Your order contains Sunday/Holiday-only items. Please select an appropriate day as your pickup date.',
        phoneHint: "Please only enter numbers, spaces, or '+'.",
        slicingSliced: "Sliced", sizeHalf: "Half",
        ingredientsTitle: "Ingredients & Allergens", nutritionTitle: "Nutritional Information", viewDetailsBtn: "View Details",
        installApp: "Install App", addedToFavorites: 'Added to favorites', removedFromFavorites: 'Removed from favorites',
        addedToCartMessage: 'added to cart',
        myOrdersBtnTitle: 'My Orders', orderHistoryTitle: 'Order History', noPastOrders: 'No past orders found.',
        reorderBtn: 'Re-order', orderOn: 'Order from', detailsBtn: 'Details',
    }
};

// --- FLOATING BADGE ANIMATION ---
function triggerFloatingBadgeAnimation() {
    const cartButton = document.getElementById('cartButton');
    if (!cartButton) return;

    const badge = document.createElement('div');
    badge.className = 'floating-badge';
    badge.textContent = '+1';
    
    cartButton.appendChild(badge);

    setTimeout(() => {
        badge.remove();
    }, 1500);
}

// --- ORDER HISTORY FUNCTIONS ---
function openOrderHistoryModal() {
    const listEl = document.getElementById('orderHistoryList');
    listEl.innerHTML = '';
    if (pastOrders.length === 0) {
        listEl.innerHTML = `<p class="text-center text-gray-500 py-8">${translations[currentLang].noPastOrders}</p>`;
    } else {
        pastOrders.forEach(order => {
            const total = order.cart.reduce((sum, item) => {
                const pricePerItem = (item.size === 'half' && item.product.price_half) ? item.product.price_half : item.product.price;
                return sum + (pricePerItem * item.quantity);
            }, 0).toFixed(2);

            const itemsHtml = order.cart.map(item => {
                let displayQuantity = item.size === 'half' ? item.quantity * 0.5 : item.quantity;
                return `<li class="text-sm text-gray-600">${displayQuantity} x ${currentLang === 'de' ? item.product.name_de : item.product.name_en}</li>`;
            }).join('');

            const orderCard = document.createElement('div');
            orderCard.className = 'p-4 border rounded-lg mb-4';
            orderCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg">${translations[currentLang].orderOn} ${order.pickupDate}</p>
                        <p class="text-sm text-gray-500">ID: ${order.orderId} | Total: ${total} €</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button data-action="toggleDetails" data-order-id="${order.orderId}" class="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm">${translations[currentLang].detailsBtn}</button>
                        <button data-action="reorder" data-order-id="${order.orderId}" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm">${translations[currentLang].reorderBtn}</button>
                    </div>
                </div>
                <div id="details-${order.orderId}" class="order-details-list pt-3 mt-3 border-t border-gray-200">
                    <ul class="list-disc list-inside">${itemsHtml}</ul>
                </div>
            `;
            listEl.appendChild(orderCard);
        });
    }
    orderHistoryModal.style.display = 'flex';
}

function toggleOrderDetails(orderId) {
    const detailsDiv = document.getElementById(`details-${orderId}`);
    if (detailsDiv) {
        if (detailsDiv.style.maxHeight && detailsDiv.style.maxHeight !== '0px') {
            detailsDiv.style.maxHeight = '0px';
        } else {
            detailsDiv.style.maxHeight = detailsDiv.scrollHeight + "px";
        }
    }
}

function closeOrderHistoryModal() {
    orderHistoryModal.style.display = 'none';
}

function reorderFromHistory(orderId) {
    const orderToReorder = pastOrders.find(o => o.orderId === orderId);
    if (orderToReorder) {
        cart = JSON.parse(JSON.stringify(orderToReorder.cart));
        updateCartCount();
        filterProducts('all', document.querySelector('.filter-category-btn[data-category="all"]'));
        closeOrderHistoryModal();
        openOrderForm();
        showSimpleToast("Order items added to your cart!");
    }
}

// --- UTILITY FUNCTIONS ---
function showSimpleToast(message, duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'simple-toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

function debounce(func, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

const publicHolidays = ["01-01", "05-01", "10-03", "10-31", "12-25", "12-26"];
function isPublicHoliday(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    if (publicHolidays.includes(`${month}-${day}`)) return true;
    const year = date.getFullYear();
    const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const easterMonth = Math.floor((h + l - 7 * m + 114) / 31), easterDay = ((h + l - 7 * m + 114) % 31) + 1;
    const easterSunday = new Date(year, easterMonth - 1, easterDay);
    const goodFriday = new Date(easterSunday);
    goodFriday.setDate(easterSunday.getDate() - 2);
    const easterMonday = new Date(easterSunday);
    easterMonday.setDate(easterSunday.getDate() + 1);
    return date.getTime() === goodFriday.getTime() || date.getTime() === easterMonday.getTime();
}

// --- DISPLAY & UI FUNCTIONS ---
function displayProducts() {
    productGrid.innerHTML = "";
    const startIndex = (currentPage - 1) * productsPerPage;
    const paginatedProducts = currentFilteredProducts.slice(startIndex, startIndex + productsPerPage);

    if (currentFilteredProducts.length === 0) {
        const query = document.getElementById('searchInput').value;
        const message = query 
            ? `${currentLang === 'de' ? 'Keine Ergebnisse für' : 'No results for'} "<strong>${query}</strong>"`
            : `${currentLang === 'de' ? 'Keine Produkte in dieser Kategorie gefunden.' : 'No products found in this category.'}`;
        productGrid.innerHTML = `<p class="col-span-full text-center text-gray-500 text-lg">${message}</p>`;
    } else {
        paginatedProducts.forEach((p, index) => {
            const card = document.createElement('div');
            card.className = 'group product bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer';
            card.dataset.productId = p.id;

            let badgeHtml = '';
            if (p.badge === 'new') {
                badgeHtml = `<div class="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10">${currentLang === 'de' ? 'Neu!' : 'New!'}</div>`;
            } else if (p.availability === 'holiday') {
                badgeHtml = `<div class="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">${currentLang === 'de' ? 'Feiertag' : 'Holiday'}</div>`;
            }

            let dietaryHtml = '';
            if (p.dietary) {
                let dietaryClasses = '';
                switch (p.dietary.toLowerCase()) {
                    case 'vegan':
                        dietaryClasses = 'bg-lime-500 text-white';
                        break;
                    case 'vegetarian':
                        dietaryClasses = 'bg-green-500 text-white';
                        break;
                    default:
                        dietaryClasses = 'bg-sky-100 text-sky-800';
                }
                dietaryHtml = `<div class="absolute bottom-3 right-3 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full z-10 ${dietaryClasses}">${p.dietary}</div>`;
            }

            const quantityInCart = cart.filter(item => item.product.id === p.id).reduce((sum, item) => sum + item.quantity, 0);
            card.innerHTML = `
                <div class="relative">
                    <img src="${p.img}" alt="${currentLang === 'de' ? p.name_de : p.name_en}" loading="lazy" class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.onerror=null; this.src='https://placehold.co/300x224/e2e8f0/475569?text=Image+Missing';">
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span class="view-details-btn bg-white text-gray-800 font-semibold rounded-full px-5 py-2" data-lang-key="viewDetailsBtn">Details ansehen</span>
                    </div>
                    ${badgeHtml}
                    ${dietaryHtml}
                    <button class="favorite-btn absolute top-3 right-3 bg-white/80 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors z-10" aria-label="Add to favorites" data-product-id="${p.id}">
                        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                    </button>
                </div>
                <div class="p-5 flex-grow flex flex-col justify-between text-center">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 truncate">${currentLang === 'de' ? p.name_de : p.name_en}</h3>
                        <p class="text-xl font-bold text-green-700 my-2">${p.price.toFixed(2)} €</p>
                    </div>
                    <div class="card-cart-controls mt-4 h-10 flex items-center justify-center">
                        <div class="quantity-selector w-full max-w-[140px] flex items-center justify-between">
                            <button class="quantity-btn w-10 h-10 border-2 border-gray-200 rounded-full text-xl font-bold text-gray-600 hover:bg-gray-100 transition" aria-label="Decrease quantity" data-action="decrease" data-product-id="${p.id}">-</button>
                            <span class="quantity-display text-lg font-bold text-gray-800">${quantityInCart}</span>
                            <button class="quantity-btn w-10 h-10 border-2 border-gray-200 rounded-full text-xl font-bold text-gray-600 hover:bg-gray-100 transition" aria-label="Increase quantity" data-action="increase" data-product-id="${p.id}">+</button>
                        </div>
                    </div>
                </div>`;
            productGrid.appendChild(card);
            updateProductCardUI(p.id);
        });
    }
    renderPaginationControls();
    applyLanguage();
}

function renderPaginationControls() {
    paginationContainer.innerHTML = '';
    const pageCount = Math.ceil(currentFilteredProducts.length / productsPerPage);
    if (pageCount <= 1) return;

    const createButton = (text, page, isDisabled = false, isCurrent = false) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `px-4 py-2 text-sm font-semibold rounded-lg transition ${isCurrent ? 'bg-green-600 text-white cursor-default' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`;
        button.disabled = isDisabled;
        if (!isDisabled) button.onclick = () => changePage(page);
        return button;
    };

    paginationContainer.appendChild(createButton(translations[currentLang].prevPage, currentPage - 1, currentPage === 1));
    for (let i = 1; i <= pageCount; i++) {
        paginationContainer.appendChild(createButton(i, i, false, i === currentPage));
    }
    paginationContainer.appendChild(createButton(translations[currentLang].nextPage, currentPage + 1, currentPage === pageCount));
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(currentFilteredProducts.length / productsPerPage)) return;
    currentPage = page;
    displayProducts();
    setTimeout(() => {
        const productGridTop = productGrid.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: productGridTop, behavior: 'smooth' });
    }, 100);
}

// --- MODAL FUNCTIONS ---
function openModal(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    currentProductInModal = p;

    document.getElementById('modalProductQuantity').value = 1;
    document.getElementById('modalImg').src = p.img;
    document.getElementById('modalTitle').textContent = currentLang === 'de' ? p.name_de : p.name_en;
    
    const ingredientsContainer = document.getElementById('modalIngredients');
    const nutritionContainer = document.getElementById('modalNutrition');
    const ingredientsTextElement = document.getElementById('modalIngredientsText');

    let ingredientsString = currentLang === 'de' ? p.ingredients_de : p.ingredients_en;
    if (ingredientsString) {
        const allergensRaw = (currentLang === 'de' ? p.allergen_de : p.allergen_en) || '';
        const allergens = allergensRaw.split(',').map(a => a.trim().toLowerCase());

        const allergenMap = {
            'gluten': ['weizenmehl', 'roggenmehl', 'dinkelmehl', 'vollkornmehl', 'gerstenmalzextrakt', 'wheat flour', 'rye flour', 'spelt flour', 'whole wheat flour', 'barley malt extract'],
            'soja': ['soja', 'soy'],
            'milch': ['milch', 'butter', 'joghurt', 'quark', 'dairy', 'milk', 'butter', 'yoghurt', 'quark'],
            'eier': ['eier', 'ei', 'eggs', 'egg'],
            'sesam': ['sesam', 'sesame'],
            'nüsse': ['walnüsse', 'mandeln', 'nüsse', 'nuts', 'walnuts', 'almonds']
        };

        allergens.forEach(allergen => {
            if (allergenMap[allergen]) {
                allergenMap[allergen].forEach(termToHighlight => {
                    const regex = new RegExp(`\\b(${termToHighlight})\\b`, 'gi');
                    ingredientsString = ingredientsString.replace(regex, '<strong>$1</strong>');
                });
            }
        });

        ingredientsTextElement.innerHTML = ingredientsString;
        ingredientsContainer.style.display = 'block';
    } else {
        ingredientsContainer.style.display = 'none';
    }

    if (p.nutrition) {
        const nutritionTable = document.getElementById('modalNutritionTable');
        nutritionTable.innerHTML = Object.entries(p.nutrition).map(([key, value]) => 
            `<div class="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                <span class="capitalize text-gray-600">${key.replace(/_/g, ' ')}</span>
                <span class="font-semibold text-gray-800">${value}</span>
            </div>`
        ).join('');
        nutritionContainer.style.display = 'block';
    } else {
        nutritionContainer.style.display = 'none';
    }
    
    document.getElementById('modalPrice').textContent = `${p.price.toFixed(2)} €`;
    modal.style.display = 'flex';
    applyLanguage();
}

function closeModal() { modal.style.display = 'none'; currentProductInModal = null; }

function openOrderForm() {
    orderModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    showCartView();
    renderCartItems();
    setMinimumDateTime();
    populatePickupHours();
    updateSubmitButtonState();
}

function closeOrderForm() {
    orderModal.style.display = 'none';
    document.body.style.overflow = '';
}

function showCartView() {
    cartView.style.display = 'flex';
    formView.style.display = 'none';
}

function showOrderFormView() {
    cartView.style.display = 'none';
    formView.style.display = 'flex';
}

// --- FILTER & SEARCH ---
function filterProducts(cat, element) {
    document.querySelectorAll('.filter-category-btn').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    
    if (cat === 'favs') {
        currentFilteredProducts = products.filter(p => favorites.has(p.id));
    } else {
        currentFilteredProducts = (cat === 'all') ? [...products]
            : (cat === 'holiday') ? products.filter(p => p.availability === 'holiday')
            : products.filter(p => p.category === cat);
    }
    
    currentPage = 1;
    displayProducts();
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    document.getElementById('clearSearchBtn').style.display = query ? 'block' : 'none';
    currentFilteredProducts = products.filter(p => (currentLang === 'de' ? p.name_de : p.name_en).toLowerCase().includes(query));
    currentPage = 1;
    displayProducts();
}
const debouncedSearch = debounce(searchProducts, 300);

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    const activeFilter = document.querySelector('.filter-category-btn.active') || document.querySelector('.filter-category-btn[data-category="all"]');
    const category = activeFilter.dataset.category;
    filterProducts(category, activeFilter);
}

function toggleSearch() {
    const searchBarContainer = document.getElementById('searchBarContainer');
    const isHidden = searchBarContainer.style.display === 'none' || !searchBarContainer.style.display;
    if (isHidden) {
        document.querySelectorAll('.filter-category-btn').forEach(btn => btn.classList.remove('active'));
        searchBarContainer.style.display = 'block';
        document.getElementById('searchInput').focus();
    } else {
        searchBarContainer.style.display = 'none';
        clearSearch();
    }
}

// --- LANGUAGE & LOCALIZATION ---
function applyLanguage() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        const translation = translations[currentLang][key];
        if (translation) {
            const icon = el.querySelector('svg, i');
            const textSpan = el.querySelector('span');
            if (key === 'installApp' && textSpan) {
                textSpan.textContent = translation;
            } else if (icon && el.classList.contains('filter-btn')) {
                el.childNodes[el.childNodes.length - 1].nodeValue = ` ${translation}`;
            } else if (key === 'yourCart' && textSpan) {
                textSpan.textContent = translation;
            } else {
                el.textContent = translation;
            }
        }
    });
    document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
        const key = el.dataset.langPlaceholder;
        if (translations[currentLang][key]) el.placeholder = translations[currentLang][key];
    });
    document.querySelectorAll('[data-lang-title]').forEach(el => {
        const key = el.dataset.langTitle;
        if (translations[currentLang][key]) el.title = translations[currentLang][key];
    });
    if (orderModal.style.display === 'flex') {
        updateSubmitButtonState();
    }
    renderCartItems();
    updateCartCount();
    renderPaginationControls();
}

function toggleLang() {
    currentLang = currentLang === 'de' ? 'en' : 'de';
    localStorage.setItem('bakeryLang', currentLang);
    showSimpleToast(currentLang === 'de' ? 'Sprache auf Deutsch geändert' : 'Language changed to English');
    displayProducts();
}

// --- CART & FAVORITES MANAGEMENT ---
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = totalItems > 0 ? totalItems : '';
    cartCountSpan.classList.toggle('scale-0', totalItems === 0);
    cartCountSpan.classList.toggle('scale-100', totalItems > 0);
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateProductCardUI(productId) {
    const productCard = document.querySelector(`.product[data-product-id='${productId}']`);
    if (productCard) {
        const quantityDisplay = productCard.querySelector('.quantity-display');
        const quantityInCart = cart.filter(item => item.product.id === productId).reduce((sum, item) => sum + item.quantity, 0);
        if (quantityDisplay) {
            quantityDisplay.textContent = quantityInCart > 0 ? quantityInCart : 0;
        }
        productCard.classList.toggle('border-green-500', quantityInCart > 0);
        productCard.classList.toggle('shadow-lg', quantityInCart > 0);
        
        const favButton = productCard.querySelector('.favorite-btn');
        if (favButton) {
            favButton.classList.toggle('active', favorites.has(productId));
        }
    }
}

function updateCartQuantity(productId, change, size = 'whole') {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    let existingItem = cart.find(item => item.product.id === productId && item.size === size);
    
    if (existingItem) {
        existingItem.quantity += change;
        if (existingItem.quantity <= 0) {
            cart = cart.filter(item => !(item.product.id === productId && item.size === size));
        } else if (change > 0) {
             const message = `${currentLang === 'de' ? product.name_de : product.name_en} ${translations[currentLang].addedToCartMessage}`;
             showSimpleToast(message);
             triggerFloatingBadgeAnimation();
        }
    } else if (change > 0) {
        const newItem = { product, quantity: change, size: size };
        if (product.category === 'bread') newItem.slicing = 'unsliced';
        cart.push(newItem);
        const message = `${currentLang === 'de' ? product.name_de : product.name_en} ${translations[currentLang].addedToCartMessage}`;
        showSimpleToast(message);
        triggerFloatingBadgeAnimation();
    }
    
    const cartButton = document.getElementById('cartButton');
    cartButton.classList.remove('jiggle');
    void cartButton.offsetWidth;
    cartButton.classList.add('jiggle');
    
    updateCartCount();
    updateProductCardUI(productId);
    renderCartItems();
}

function addToCartFromModal() {
    if (!currentProductInModal) return;
    const quantity = parseInt(document.getElementById('modalProductQuantity').value);
    updateCartQuantity(currentProductInModal.id, quantity);
    closeModal();
}

function updateSlicingPreference(itemIndex, isChecked) {
    if (cart[itemIndex]) {
        cart[itemIndex].slicing = isChecked ? 'sliced' : 'unsliced';
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
    }
}

function updateSizePreference(itemIndex, isChecked) {
    if (cart[itemIndex]) {
        const oldItem = cart[itemIndex];
        const newSize = isChecked ? 'half' : 'whole';
        
        const existingItemWithNewSize = cart.find((item, index) => 
            item.product.id === oldItem.product.id && item.size === newSize && index !== itemIndex
        );

        if (existingItemWithNewSize) {
            existingItemWithNewSize.quantity += oldItem.quantity;
            cart.splice(itemIndex, 1);
        } else {
            oldItem.size = newSize;
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
        updateProductCardUI(oldItem.product.id);
    }
}

function saveFavorites() { localStorage.setItem('bakeryFavorites', JSON.stringify([...favorites])); }

function toggleFavorite(productId) {
    if (favorites.has(productId)) {
        favorites.delete(productId);
        showSimpleToast(translations[currentLang].removedFromFavorites);
    } else {
        favorites.add(productId);
        showSimpleToast(translations[currentLang].addedToFavorites);
    }
    saveFavorites();
    updateProductCardUI(productId);
}

function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submitOrderBtn');
    const continueBtn = document.getElementById('continueToOrderBtn');
    const isCartEmpty = cart.length === 0;
    
    if(continueBtn) continueBtn.disabled = isCartEmpty;
    if(submitBtn) submitBtn.disabled = isCartEmpty || !validateCartAgainstPickupDate();
}

function updateCartItemQuantity(itemIndex, change) {
    if (!cart[itemIndex]) return;

    const item = cart[itemIndex];
    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(itemIndex);
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
        updateCartCount();
        updateProductCardUI(item.product.id);
    }
}

function emptyCart() {
    const productIdsToUpdate = [...new Set(cart.map(item => item.product.id))];
    
    cart = [];
    
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    updateCartCount();
    
    productIdsToUpdate.forEach(id => updateProductCardUI(id));
    showSimpleToast(currentLang === 'de' ? 'Warenkorb geleert' : 'Cart emptied');
}

// =================================================================================
// --- MODIFIED FUNCTION TO PREVENT HORIZONTAL SCROLLING ---
// =================================================================================
function renderCartItems() {
    const listEl = document.getElementById('selectedProductsList');
    const totalEl = document.getElementById('cartTotal');
    if (!listEl || !totalEl) return;

    let totalPrice = 0;
    if (cart.length === 0) {
        listEl.innerHTML = `<p class="text-center text-gray-500 py-8">${translations[currentLang].noProductsAddedAlert}</p>`;
    } else {
        listEl.innerHTML = '';
        cart.forEach((item, index) => {
            const pricePerItem = (item.size === 'half' && item.product.price_half) ? item.product.price_half : item.product.price;
            const itemPrice = pricePerItem * item.quantity;
            totalPrice += itemPrice;

            let optionsHtml = '';
            if (item.product.canBeHalved || item.product.category === 'bread') {
                optionsHtml += '<div class="flex items-center gap-2 flex-wrap">';
                if (item.product.canBeHalved) {
                    optionsHtml += `
                        <div>
                            <input type="checkbox" id="sizeHalf-${index}" class="hidden peer" onchange="updateSizePreference(${index}, this.checked)" ${item.size === 'half' ? 'checked' : ''}>
                            <label for="sizeHalf-${index}" class="text-xs font-medium px-2 py-1 rounded-full cursor-pointer transition bg-gray-200 text-gray-700 peer-checked:bg-green-600 peer-checked:text-white">${translations[currentLang].sizeHalf}</label>
                        </div>`;
                }
                if (item.product.category === 'bread') {
                    optionsHtml += `
                        <div>
                            <input type="checkbox" id="sliceYes-${index}" class="hidden peer" onchange="updateSlicingPreference(${index}, this.checked)" ${item.slicing === 'sliced' ? 'checked' : ''}>
                            <label for="sliceYes-${index}" class="text-xs font-medium px-2 py-1 rounded-full cursor-pointer transition bg-gray-200 text-gray-700 peer-checked:bg-green-600 peer-checked:text-white">${translations[currentLang].slicingSliced}</label>
                        </div>`;
                }
                optionsHtml += '</div>';
            }
            
            const itemRow = document.createElement('div');
            // This new structure uses CSS Grid for robust alignment
            itemRow.className = 'grid grid-cols-[auto_1fr] gap-x-4 py-4 border-b last:border-b-0';
            itemRow.innerHTML = `
                <img src="${item.product.img}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-sm row-span-2" onerror="this.onerror=null; this.src='https://placehold.co/80x80/e2e8f0/475569?text=...';">
                
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold leading-tight">${currentLang === 'de' ? item.product.name_de : item.product.name_en}</p>
                        <p class="text-sm text-gray-500">${item.quantity} × ${pricePerItem.toFixed(2)} €</p>
                    </div>
                    <p class="font-bold text-base sm:text-lg whitespace-nowrap pl-2">${itemPrice.toFixed(2)} €</p>
                </div>

                <div class="flex items-center justify-between mt-2">
                    <div>${optionsHtml}</div>
                    <div class="flex items-center gap-2 border rounded-full p-1">
                        <button type="button" onclick="updateCartItemQuantity(${index}, -1)" class="w-7 h-7 flex items-center justify-center rounded-full text-lg font-bold text-gray-600 hover:bg-gray-100 transition">-</button>
                        <span class="w-6 text-center font-semibold text-gray-800">${item.quantity}</span>
                        <button type="button" onclick="updateCartItemQuantity(${index}, 1)" class="w-7 h-7 flex items-center justify-center rounded-full text-lg font-bold text-gray-600 hover:bg-gray-100 transition">+</button>
                    </div>
                </div>
            `;
            listEl.appendChild(itemRow);
        });
    }
    totalEl.textContent = `${totalPrice.toFixed(2)} €`;
    updateSubmitButtonState();
}

function removeFromCart(index) {
    if (!cart[index]) return;
    const productId = cart[index].product.id;
    cart.splice(index, 1);
    renderCartItems();
    updateCartCount();
    updateProductCardUI(productId);
}

// --- ORDER FORM & SUBMISSION ---
function setMinimumDateTime() {
    const now = new Date();
    const minDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    pickupDateInput.min = minDate;
    if (pickupDateInput.value < minDate) pickupDateInput.value = minDate;
}

function populatePickupHours() {
    pickupTimeSelect.innerHTML = '';
    const selectedDate = new Date(`${pickupDateInput.value}T00:00:00`);
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const dayOfWeek = selectedDate.getDay();
    let startHour = (dayOfWeek === 0 || isPublicHoliday(selectedDate)) ? 8 : 7;
    let endHour = (dayOfWeek === 0 || isPublicHoliday(selectedDate)) ? 12 : 19;
    let firstAvailableHourSet = false;
    for (let hour = startHour; hour < endHour; hour++) {
        const option = document.createElement('option');
        option.value = hour.toString().padStart(2, '0');
        option.textContent = `${hour}:00`;
        if (isToday && hour <= now.getHours()) option.disabled = true;
        pickupTimeSelect.appendChild(option);
        if (!firstAvailableHourSet && !option.disabled) {
            option.selected = true;
            firstAvailableHourSet = true;
        }
    }
}

function validateCartAgainstPickupDate() {
    const messageContainer = document.getElementById('date-validation-message');
    if (!pickupDateInput.value) {
        messageContainer.textContent = '';
        return true; 
    }
    const hasHolidayItem = cart.some(item => item.product.availability === 'holiday');
    const selectedDate = new Date(`${pickupDateInput.value}T00:00:00`);
    const isHolidayOrSunday = selectedDate.getDay() === 0 || isPublicHoliday(selectedDate);
    
    if (hasHolidayItem && !isHolidayOrSunday) {
        messageContainer.textContent = translations[currentLang].holidayProductOnNonHolidayAlert;
        return false;
    }
    
    messageContainer.textContent = '';
    return true;
}

function handleDateChange() {
    populatePickupHours();
    updateSubmitButtonState();
}

function generateOrderId() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay).toString().padStart(3, '0');
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${dayOfYear}${randomPart}`;
}

function submitOrder(event) {
    event.preventDefault();
    if (!validateCartAgainstPickupDate()) {
        showSimpleToast(translations[currentLang].holidayProductOnNonHolidayAlert);
        return;
    }
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById('submitOrderBtn');

    const name = formData.get('name');
    const phone = formData.get('phone');
    const email = formData.get('email') || (currentLang === 'de' ? 'Nicht angegeben' : 'Not provided');
    const pickupDate = formData.get('pickupDate');
    const pickupTime = formData.get('pickupTime');
    const userMessage = formData.get('message');
    const orderId = generateOrderId();
    
    const lastOrder = { orderId, name, phone, pickupDate, pickupTime, cart: JSON.parse(JSON.stringify(cart)) };
    localStorage.setItem('lastOrder', JSON.stringify(lastOrder));
    
    const cartSummary = cart.map(item => {
        let optionText = '';
        if (item.slicing === 'sliced') optionText += ` (${translations[currentLang].slicingSliced})`;
        let displayQuantity = item.size === 'half' ? item.quantity * 0.5 : item.quantity;
        return `${displayQuantity} x ${currentLang === 'de' ? item.product.name_de : item.product.name_en}${optionText}`;
    }).join('\n');

    const total = cart.reduce((sum, item) => {
        const pricePerItem = (item.size === 'half' && item.product.price_half) ? item.product.price_half : item.product.price;
        return sum + (pricePerItem * item.quantity);
    }, 0).toFixed(2);

    const emailBody = `
Bestellnummer: ${orderId}
--------------------------------
Name: ${name}
Telefonnummer: ${phone}
E-Mail: ${email}
Abholdatum: ${pickupDate} um ${pickupTime}:00 Uhr
--------------------------------
Bestelldetails:
${cartSummary}
Gesamt: ${total} €
--------------------------------
Nachricht: 
${userMessage || '-'}`;
    
    const dataToSend = new FormData();
    dataToSend.append('access_key', formData.get('access_key'));
    dataToSend.append('subject', ` Bestellung: #${orderId}`);
    dataToSend.append('from_name', name);
    dataToSend.append('text', emailBody);

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${currentLang === 'de' ? 'Wird gesendet...' : 'Sending...'}`;

    fetch(form.action, {
        method: form.method,
        body: dataToSend,
        headers: { 'Accept': 'application/json' }
    }).then(response => {
        if (response.ok) {
            window.location.href = 'thank-you.html';
        } else {
            response.json().then(data => {
                console.error("Submission error data:", data);
                showSimpleToast(currentLang === 'de' ? 'Ein Fehler ist aufgetreten.' : 'An error occurred.');
            });
        }
    }).catch(error => {
        console.error('Submission fetch error:', error);
        showSimpleToast(currentLang === 'de' ? 'Die Bestellung konnte nicht gesendet werden.' : 'The order could not be sent.');
    }).finally(() => {
        submitBtn.disabled = false;
        applyLanguage();
    });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial setup
    productGrid.innerHTML = '<div class="loading-spinner col-span-full"></div>';
    fetch('Products.json')
        .then(res => res.json())
        .then(data => {
            products = data;
            const initialFilterButton = document.querySelector('.filter-btn[data-category="all"]');
            filterProducts('all', initialFilterButton);
        })
        .catch(error => {
            console.error("Failed to load products:", error);
            productGrid.innerHTML = '<p>Error loading products.</p>';
        });

    applyLanguage();
    updateCartCount();

    // --- EVENT LISTENERS ---
    
    // Header and Cart
    document.getElementById('orderHistoryBtn')?.addEventListener('click', openOrderHistoryModal);
    document.getElementById('installAppBtn')?.addEventListener('click', () => {
        if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); }
    });
    document.getElementById('cartButton')?.addEventListener('click', openOrderForm);
    document.querySelector('.lang-switch')?.addEventListener('click', toggleLang);
    document.getElementById('emptyCartBtn')?.addEventListener('click', emptyCart);


    // Filter and Search Controls
    document.getElementById('filterControls')?.addEventListener('click', (event) => {
        const btn = event.target.closest('.filter-btn');
        if (!btn) return;
        
        const category = btn.dataset.category;
        if (category) {
            filterProducts(category, btn);
        } else if (btn.dataset.action === 'toggleSearch') {
            toggleSearch();
        }
    });
    document.getElementById('searchInput')?.addEventListener('keyup', debouncedSearch);
    document.getElementById('clearSearchBtn')?.addEventListener('click', clearSearch);

    // Product Grid (using event delegation)
    productGrid.addEventListener('click', (event) => {
        const target = event.target;
        const favoriteButton = target.closest('.favorite-btn');
        const quantityButton = target.closest('.quantity-btn');
        const productCard = target.closest('.product');
        
        if (favoriteButton) {
            toggleFavorite(parseInt(favoriteButton.dataset.productId));
            return;
        }
        if (quantityButton) {
            const action = quantityButton.dataset.action;
            const id = parseInt(quantityButton.dataset.productId);
            updateCartQuantity(id, action === 'increase' ? 1 : -1);
            return;
        }
        if (productCard && !favoriteButton && !quantityButton) {
            openModal(parseInt(productCard.dataset.productId));
        }
    });

    //
