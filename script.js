// Global state variables
let products = [];
let currentLang = localStorage.getItem('bakeryLang') || 'de';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let pastOrders = JSON.parse(localStorage.getItem('pastOrders')) || [];
let currentProductInModal = null;
let currentPage = 1;
const productsPerPage = 12;
let currentFilteredProducts = [];
let deferredInstallPrompt = null; // For PWA installation

// DOM element references
const modal = document.getElementById('modal');
const orderModal = document.getElementById('orderModal');
const pastOrdersModal = document.getElementById('pastOrdersModal');
const productGrid = document.getElementById('productGrid');
const cartCountSpan = document.getElementById('cartCount');
const pickupDateInput = document.getElementById('pickupDate');
const pickupTimeSelect = document.getElementById('pickupTime');
const paginationContainer = document.getElementById('paginationContainer');
const installAppBtn = document.getElementById('installAppBtn');

// ===================================
// PWA Installation Logic
// ===================================
window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installAppBtn) {
        installAppBtn.style.display = 'inline-flex';
    }
});

if (installAppBtn) {
    installAppBtn.addEventListener('click', () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredInstallPrompt = null;
                installAppBtn.style.display = 'none';
            });
        }
    });
}


// ===================================
// Utility Functions
// ===================================

function showToast(message, type = '', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconHtml = '';
    if (type === 'success') {
        iconHtml = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
        iconHtml = '<i class="fas fa-exclamation-circle"></i>';
    }

    toast.innerHTML = `${iconHtml} <span>${message}</span>`;
    container.appendChild(toast);
    container.style.bottom = '40px';

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

function debounce(func, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// ===================================
// Translations and Data
// ===================================
const translations = {
  de: {
    langSwitch: 'Deutsch', mainTitle: 'Macis Biobäckerei in Leipzig', subTitle: 'Traditionelle Backkunst, jeden Tag frisch',
    orderNowBtn: 'Jetzt bestellen', allBakedGoods: 'Alle Backwaren', bread: 'Brot', rolls: 'Brötchen', sweets: 'Süßes', searchBtn: 'Suche',
    holidaySpecials: 'Sonn- & Feiertags', favorites: 'Favoriten', continueToOrder: 'Weiter zur Bestellung', backToCart: 'Zurück zum Warenkorb',
    orderTitle: 'Deine Bestellung', submitBtn: 'Absenden', contactTitle: 'Kontakt', addressLabel: 'Adresse:', phoneLabel: 'Telefon:', emailLabel: 'E-Mail:',
    openingHoursTitle: 'Öffnungszeiten', openingHoursWeekday: 'Montag – Samstag: 7:00 – 19:00 Uhr', openingHoursSunday: 'Sonntag: 8:00 – 12:00 Uhr',
    selectProductQuantityAlert: 'Bitte gib eine gültige Menge ein.', noProductsAddedAlert: 'Dein Warenkorb ist leer.',
    addAtLeastOneProductAlert: 'Bitte füge mindestens ein Produkt zum Warenkorb hinzu.', providePhoneNumberAlert: 'Bitte gib deine Telefonnummer an, um die Bestellung abzuschicken.',
    orderSuccessAlert: 'Vielen Dank für deine Bestellung! Wir haben sie erhalten.', newOrderEmailSubject: 'Neue Bäckerei Bestellung', newOrderEmailBodyTitle: 'Neue Bestellung:',
    nameEmailBody: 'Name:', emailEmailBody: 'E-Mail:', phoneEmailBody: 'Telefon:', productsEmailBody: 'Produkte:', messageEmailBody: 'Nachricht:',
    pickupDateLabel: 'Abholdatum:', pickupTimeLabel: 'Abholzeit:',
    pickupTimeInvalid: 'Bitte wähle eine Abholzeit innerhalb der Öffnungszeiten (Mo-Sa: 7-19 Uhr, So: 8-12 Uhr).', pickupTimePast: 'Die gewählte Abholzeit liegt in der Vergangenheit.',
    addToCartBtn: 'Zum Warenkorb', yourCart: 'Dein Warenkorb', searchPlaceholder: 'Gib ein, was du suchst...', yourName: 'Dein Name', phoneNumber: 'Telefonnummer',
    emailOptional: 'E-Mail (optional)', messageOptional: 'Message (optional)', notProvided: '-', totalText: 'Gesamt:',
    prevPage: 'Zurück', nextPage: 'Weiter',
    holidayProductOnNonHolidayAlert: 'Ihre Bestellung enthält Artikel, die nur an Sonn- und Feiertagen erhältlich sind. Bitte wählen Sie einen entsprechenden Tag als Abholdatum.',
    phoneHint: "Bitte nur Zahlen, Leerzeichen oder '+' eingeben.",
    slicingTitle: "Schneide-Präferenz",
    slicingUnsliced: "Am Stück",
    slicingSliced: "Geschnitten",
    sizeTitle: "Größe",
    sizeWhole: "Ganzes",
    sizeHalf: "Halbes",
    ingredientsTitle: "Zutaten & Allergene",
    nutritionTitle: "Nährwertangaben",
    viewDetailsBtn: "Details ansehen",
    installApp: "App installieren",
    noFavorites: "Du hast noch keine Favoriten gespeichert. Klicke auf das Herz-Symbol bei einem Produkt, um es hier zu sehen.",
    emptyCart: "Warenkorb leeren",
    cartEmptied: "Warenkorb geleert",
    contactInfo: "Kontaktdaten",
    pickupDetails: "Abholdetails",
    add: "Hinzufügen",
    pastOrders: "Frühere Bestellungen",
    noPastOrders: "Du hast noch keine Bestellungen aufgegeben."
  },
  en: {
    langSwitch: 'English', mainTitle: 'Macis Organic Bakery in Leipzig', subTitle: 'Traditional Baking, Fresh Every Day',
    orderNowBtn: 'Order Now', allBakedGoods: 'All Baked Goods', bread: 'Bread', rolls: 'Rolls', sweets: 'Sweets', searchBtn: 'Search',
    holidaySpecials: 'Sundays & Holidays', favorites: 'Favorites', continueToOrder: 'Continue to Order', backToCart: 'Back to Cart',
    orderTitle: 'Your Order', submitBtn: 'Submit', contactTitle: 'Contact', addressLabel: 'Address:', phoneLabel: 'Phone:', emailLabel: 'Email:',
    openingHoursTitle: 'Opening Hours', openingHoursWeekday: 'Monday – Saturday: 7:00 AM – 7:00 PM', openingHoursSunday: 'Sunday: 8:00 AM – 12:00 PM',
    selectProductQuantityAlert: 'Please enter a valid quantity.', noProductsAddedAlert: 'Your cart is empty.',
    addAtLeastOneProductAlert: 'Please add at least one product to the cart.', providePhoneNumberAlert: 'Please provide your phone number to submit the order.',
    orderSuccessAlert: 'Thank you for your order! We have received it.', newOrderEmailSubject: 'New Bakery Order', newOrderEmailBodyTitle: 'New Order:',
    nameEmailBody: 'Name:', emailEmailBody: 'Email:', phoneEmailBody: 'Phone:', productsEmailBody: 'Products:', messageEmailBody: 'Message:',
    pickupDateLabel: 'Pickup Date:', pickupTimeLabel: 'Pickup Time:',
    pickupTimeInvalid: 'Please select a pickup time within opening hours (Mon-Sat: 7 AM - 7 PM, Sun: 8 AM - 12 PM).', pickupTimePast: 'The selected pickup time is in the past.',
    addToCartBtn: 'Add to Cart', yourCart: 'Your Cart', searchPlaceholder: 'Enter what you are looking for...', yourName: 'Your Name', phoneNumber: 'Phone Number',
    emailOptional: 'E-Mail (optional)', messageOptional: 'Message (optional)', notProvided: '-', totalText: 'Total:',
    prevPage: 'Previous', nextPage: 'Next',
    holidayProductOnNonHolidayAlert: 'Your order contains Sunday/Holiday-only items. Please select an appropriate day as your pickup date.',
    phoneHint: "Please only enter numbers, spaces, or '+'.",
    slicingTitle: "Slicing Preference",
    slicingUnsliced: "Unsliced",
    slicingSliced: "Sliced",
    sizeTitle: "Size",
    sizeWhole: "Whole",
    sizeHalf: "Half",
    ingredientsTitle: "Ingredients (allergens are highlighted)",
    nutritionTitle: "Nutritional Information",
    viewDetailsBtn: "View Details",
    installApp: "Install App",
    noFavorites: "You haven't saved any favorites yet. Click the heart icon on a product to see it here.",
    emptyCart: "Empty Cart",
    cartEmptied: "Cart emptied",
    contactInfo: "Contact Information",
    pickupDetails: "Pickup Details",
    add: "Add",
    pastOrders: "Past Orders",
    noPastOrders: "You have no past orders."
  }
};

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

// ===================================
// Application Logic
// ===================================
function showSkeletonLoaders() {
    productGrid.innerHTML = '';
    paginationContainer.innerHTML = '';
    for (let i = 0; i < productsPerPage; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'product card-style skeleton';
        skeletonCard.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
            </div>
        `;
        productGrid.appendChild(skeletonCard);
    }
}

function displayProducts() {
    productGrid.innerHTML = "";
    productGrid.classList.remove('loaded');
    const startIndex = (currentPage - 1) * productsPerPage;
    const paginatedProducts = currentFilteredProducts.slice(startIndex, startIndex + productsPerPage);

    if (currentFilteredProducts.length === 0) {
        let message = '';
        const activeFilter = document.querySelector('.filter-category-btn.active');
        const isFavorites = activeFilter && activeFilter.id === 'filterFavoritesBtn';
        
        if (isFavorites) {
            message = translations[currentLang].noFavorites;
        } else {
            const query = document.getElementById('searchInput').value;
            message = query 
                ? `${currentLang === 'de' ? 'Keine Ergebnisse für' : 'No results for'} "<strong>${query}</strong>"`
                : `${currentLang === 'de' ? 'Keine Produkte in dieser Kategorie gefunden.' : 'No products found in this category.'}`;
        }
        productGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; font-size: 1.2rem;">${message}</p>`;

    } else {
        paginatedProducts.forEach((p, index) => {
            const card = document.createElement('div');
            card.className = 'product card-style';
            card.dataset.productId = p.id;
            card.style.animationDelay = `${index * 60}ms`;

            let badgeHtml = '';
            if (p.badge === 'new') {
                badgeHtml = `<div class="product-badge new">${currentLang === 'de' ? 'Neu!' : 'New!'}</div>`;
            } else if (p.availability === 'holiday') {
                badgeHtml = `<div class="product-badge">${currentLang === 'de' ? 'Sonn- & Feiertags' : 'Sundays & Holidays'}</div>`;
            }

            const dietaryHtml = p.dietary ? `<div class="dietary-badge-card badge-${p.dietary}">${p.dietary}</div>` : '';
            const isFavorited = favorites.includes(p.id);

            card.innerHTML = `
                <div class="product-image-container" data-product-id="${p.id}">
                    <img src="${p.img}" alt="${currentLang === 'de' ? p.name_de : p.name_en}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/220x220?text=Image+Missing';">
                    ${badgeHtml}
                    ${dietaryHtml}
                    <div class="view-details-btn" data-lang-key="viewDetailsBtn">Details ansehen</div>
                    <button class="favorite-btn ${isFavorited ? 'active' : ''}" data-product-id="${p.id}" aria-label="Toggle Favorite">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <h3>${currentLang === 'de' ? p.name_de : p.name_en}</h3>
                    <p class="product-price">${p.price.toFixed(2)} €</p>
                </div>
                <div class="card-cart-controls" data-product-id="${p.id}">
                    <button class="add-to-cart-initial-btn" data-action="increase">
                        <span data-lang-key="add">${translations[currentLang].add}</span>
                    </button>
                    <div class="quantity-selector" style="display: none;">
                        <button class="quantity-btn" aria-label="Decrease quantity" data-action="decrease">-</button>
                        <span class="quantity-display" aria-live="polite">0</span>
                        <button class="quantity-btn" aria-label="Increase quantity" data-action="increase">+</button>
                    </div>
                </div>
            `;
            productGrid.appendChild(card);
            updateProductCardUI(p.id);
        });
    }

    setTimeout(() => productGrid.classList.add('loaded'), 10);
    renderPaginationControls();
    applyLanguage();
}

function renderPaginationControls() {
    paginationContainer.innerHTML = '';
    const pageCount = Math.ceil(currentFilteredProducts.length / productsPerPage);
    if (pageCount <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.textContent = translations[currentLang].prevPage;
    prevButton.classList.add('page-btn');
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => changePage(currentPage - 1);
    paginationContainer.appendChild(prevButton);

    for (let i = 1; i <= pageCount; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('page-btn');
        if (i === currentPage) pageButton.classList.add('active');
        pageButton.onclick = () => changePage(i);
        paginationContainer.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = translations[currentLang].nextPage;
    nextButton.classList.add('page-btn');
    nextButton.disabled = currentPage === pageCount;
    nextButton.onclick = () => changePage(currentPage + 1);
    paginationContainer.appendChild(nextButton);
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(currentFilteredProducts.length / productsPerPage)) return;
    currentPage = page;
    showSkeletonLoaders();
    setTimeout(displayProducts, 300);
    setTimeout(() => {
        const productGridTop = productGrid.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: productGridTop, behavior: 'smooth' });
    }, 100);
}

function openModal(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    currentProductInModal = p;

    // --- Populate New Modal Elements ---
    document.getElementById('modalImg').src = p.img;
    document.getElementById('modalTitle').textContent = currentLang === 'de' ? p.name_de : p.name_en;
    document.getElementById('modalPrice').textContent = `${p.price.toFixed(2)} €`;
    
    // Description
    const descriptionContainer = document.getElementById('modalDescriptionContainer');
    const descriptionText = document.getElementById('modalDescription');
    const desc = currentLang === 'de' ? p.description_de : p.description_en;
    if (desc) {
        descriptionText.textContent = desc;
        descriptionContainer.style.display = 'block';
    } else {
        descriptionContainer.style.display = 'none';
    }

    // Dietary Badge
    const dietaryContainer = document.getElementById('modalDietary');
    if (p.dietary) {
        dietaryContainer.innerHTML = `<span class="badge-${p.dietary}">${p.dietary}</span>`;
        dietaryContainer.style.display = 'block';
    } else {
        dietaryContainer.style.display = 'none';
    }

    // Ingredients
    const ingredientsContainer = document.getElementById('modalIngredientsContainer');
    const ingredientsText = document.getElementById('modalIngredientsText');
    let ingredientsString = currentLang === 'de' ? p.ingredients_de : p.ingredients_en;
    if (ingredientsString) {
        let allergens = (currentLang === 'de' ? p.allergen_de : p.allergen_en).split(', ');
        const allergenMap = {'Gluten': ['Weizenmehl', 'Roggenmehl', 'Dinkelmehl', 'Gerstenmalzextrakt', 'Wheat flour', 'rye flour', 'spelt flour', 'barley malt extract'],'Soja': ['Soja', 'Soy'],'Milch': ['Milch', 'Butter', 'Joghurt', 'Quark', 'Dairy', 'milk', 'butter', 'yoghurt', 'quark'],'Eier': ['Eier', 'Ei', 'Eggs', 'egg'],'Sesam': ['Sesam', 'Sesame'],'Nüsse': ['Walnüsse', 'Mandeln', 'Nuts', 'walnuts', 'almonds']};
        allergens.forEach(allergen => {
            if (allergenMap[allergen]) {
                allergenMap[allergen].forEach(ingredientWord => {
                    const regex = new RegExp(`\\b(${ingredientWord})\\b`, 'gi');
                    ingredientsString = ingredientsString.replace(regex, '<strong>$1</strong>');
                });
            }
        });
        ingredientsText.innerHTML = ingredientsString;
        ingredientsContainer.style.display = 'block';
    } else {
        ingredientsContainer.style.display = 'none';
    }

    // Nutrition
    const nutritionContainer = document.getElementById('modalNutritionContainer');
    const nutritionTable = document.getElementById('modalNutritionTable');
    if (p.nutrition) {
        nutritionTable.innerHTML = '';
        for (const [key, value] of Object.entries(p.nutrition)) {
            nutritionTable.innerHTML += `<div><span>${key.replace(/_/g, ' ')}:</span> <span>${value}</span></div>`;
        }
        nutritionContainer.style.display = 'block';
    } else {
        nutritionContainer.style.display = 'none';
    }
    
    // Favorite Button
    const favBtn = document.getElementById('modalFavoriteBtn');
    favBtn.classList.toggle('active', favorites.includes(p.id));
    favBtn.onclick = () => {
        toggleFavorite(p.id);
        favBtn.classList.toggle('active');
    };

    document.getElementById('modalProductQuantity').value = 1;
    modal.style.display = 'flex';
    applyLanguage();
}


function closeModal() {
  modal.style.display = 'none';
  currentProductInModal = null;
}

function openOrderForm() {
  orderModal.style.display = 'flex';
  showCartView();
  renderCartItems();
  setMinimumDateTime();
  populatePickupHours();
  validateCartAgainstPickupDate();
}

function closeOrderForm() {
  orderModal.style.display = 'none';
}

function openPastOrdersModal() {
    renderPastOrders();
    pastOrdersModal.style.display = 'flex';
}

function renderPastOrders() {
    const listContainer = document.getElementById('pastOrdersList');
    if (!listContainer) return;

    if (pastOrders.length === 0) {
        listContainer.innerHTML = `<p>${translations[currentLang].noPastOrders}</p>`;
        return;
    }

    let html = '';
    pastOrders.forEach(order => {
        const itemsHtml = order.cart.map(item => {
            const productName = currentLang === 'de' ? item.product.name_de : item.product.name_en;
            return `<li>${item.quantity} x ${productName}</li>`;
        }).join('');

        const total = order.cart.reduce((sum, item) => {
            const pricePerItem = (item.size === 'half' && item.product.price_half) ? item.product.price_half : item.product.price;
            return sum + (pricePerItem * item.quantity);
        }, 0).toFixed(2);

        html += `
            <div class="past-order-item">
                <div class="past-order-header">
                    <span>Order #${order.orderId}</span>
                    <span>${order.pickupDate}</span>
                </div>
                <ul class="past-order-items">${itemsHtml}</ul>
                <div class="past-order-total">${translations[currentLang].totalText} ${total} €</div>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}


function showCartView() {
    document.getElementById('cartView').style.display = 'block';
    document.getElementById('formView').style.display = 'none';
    document.getElementById('stepCart').classList.add('active');
    document.getElementById('stepForm').classList.remove('active');
    renderCartItems();
}

function showOrderFormView() {
    if (cart.length === 0) {
        showToast(translations[currentLang].addAtLeastOneProductAlert, 'error');
        return;
    }
    document.getElementById('cartView').style.display = 'none';
    document.getElementById('formView').style.display = 'block';
    document.getElementById('stepCart').classList.remove('active');
    document.getElementById('stepForm').classList.add('active');
}

function filterProducts(event, cat, element) {
    if (event) event.preventDefault();

    document.querySelectorAll('.filter-category-btn, .dropdown-option').forEach(btn => btn.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
        
        // *** THE FIX (for both mobile and desktop) ***
        // Get the lang key from the clicked element (desktop button or mobile option)
        const langKey = element.dataset.langKey;
        const selectedCategorySpan = document.getElementById('selectedCategory');
        
        // If they exist, update the mobile dropdown display span's key.
        // `applyLanguage` will then use this correct key to show the right text.
        if (langKey && selectedCategorySpan) {
            selectedCategorySpan.dataset.langKey = langKey;
        }
    }
    
    if(element && element.classList.contains('dropdown-option')) {
        const selectedCategoryText = element.textContent;
        // This line provides an immediate visual update before the products reload, which is good UX.
        document.getElementById('selectedCategory').textContent = selectedCategoryText; 
        const dropdownMenu = document.getElementById('categoryDropdownMenu');
        dropdownMenu.classList.remove('is-open');
        document.getElementById('categoryDropdownBtn').classList.remove('active');
    }

    if (cat === 'all') {
        currentFilteredProducts = [...products];
    } else if (cat === 'favorites') {
        currentFilteredProducts = products.filter(p => favorites.includes(p.id));
    } else if (cat === 'holiday') {
        currentFilteredProducts = products.filter(p => p.availability === 'holiday');
    } else {
        currentFilteredProducts = products.filter(p => p.category === cat);
    }
    
    currentPage = 1;
    showSkeletonLoaders();
    setTimeout(displayProducts, 300);
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
  const activeFilter = document.querySelector('.filter-category-btn.active') || document.querySelector('.filter-category-btn');
  const category = activeFilter.getAttribute('onclick').match(/'([^']+)'/)[1];
  filterProducts(null, category, activeFilter);
}

function toggleSearch() {
  const searchBarContainer = document.getElementById('searchBarContainer');
  const isHidden = searchBarContainer.style.display === 'none' || !searchBarContainer.style.display;
  if (isHidden) {
      document.querySelectorAll('.filter-category-btn').forEach(btn => btn.classList.remove('active'));
      setTimeout(() => {
          searchBarContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.getElementById('searchInput').focus();
      }, 100);
  }
  searchBarContainer.style.display = isHidden ? 'block' : 'none';
  if (!isHidden) clearSearch();
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-lang-key]').forEach(el => {
    const key = el.dataset.langKey;
    const translation = translations[currentLang][key];
    if (translation) {
      const icon = el.querySelector('i');
      const textSpan = el.querySelector('span:not(.cart-count-text)');

      if (key === 'searchBtn' && icon) el.title = translation;
      else if (key === 'yourCart') {
        const cartTextSpan = el.querySelector('.cart-icon-text');
        if (cartTextSpan) cartTextSpan.textContent = translation;
      } else if (key === 'installApp' && textSpan) {
        textSpan.textContent = translation;
      } else if (textSpan) {
        textSpan.textContent = translation;
      } else if (icon && !el.classList.contains('social-icon')) {
        el.innerHTML = `${icon.outerHTML} ${translation}`;
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
  if (orderModal.style.display === 'flex') validateCartAgainstPickupDate();
  renderCartItems();
  updateCartCount();
  renderPaginationControls();
}

function toggleLang() {
  currentLang = currentLang === 'de' ? 'en' : 'de';
  localStorage.setItem('bakeryLang', currentLang);
  const langName = currentLang === 'de' ? 'Deutsch' : 'English';
  showToast(langName);
  displayProducts();
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const countText = totalItems > 0 ? totalItems : '';
  cartCountSpan.textContent = countText;
  cartCountSpan.classList.toggle('visible', totalItems > 0);
  localStorage.setItem('cart', JSON.stringify(cart));

  products.forEach(p => updateProductCardUI(p.id));
}

function updateProductCardUI(productId) {
    const productCards = document.querySelectorAll(`.product[data-product-id='${productId}']`);
    if (productCards.length === 0) return;

    const quantityInCart = cart.filter(item => item.product.id === productId).reduce((sum, item) => sum + item.quantity, 0);

    productCards.forEach(card => {
        const initialBtn = card.querySelector('.add-to-cart-initial-btn');
        const quantitySelector = card.querySelector('.quantity-selector');
        const quantityDisplay = card.querySelector('.quantity-display');

        if (quantityInCart > 0) {
            if (initialBtn) initialBtn.style.display = 'none';
            if (quantitySelector) quantitySelector.style.display = 'flex';
            if (quantityDisplay) quantityDisplay.textContent = quantityInCart;
        } else {
            if (initialBtn) initialBtn.style.display = 'flex';
            if (quantitySelector) quantitySelector.style.display = 'none';
        }
        
        card.classList.toggle('in-cart', quantityInCart > 0);
        
        const favButton = card.querySelector('.favorite-btn');
        if (favButton) {
            favButton.classList.toggle('active', favorites.includes(productId));
        }
    });
}


function toggleFavorite(productId) {
    const productIndex = favorites.indexOf(productId);
    const product = products.find(p => p.id === productId);
    const productName = currentLang === 'de' ? product.name_de : product.name_en;

    if (productIndex > -1) {
        favorites.splice(productIndex, 1);
        showToast(`${productName} ${currentLang === 'de' ? 'von Favoriten entfernt' : 'removed from favorites'}`);
    } else {
        favorites.push(productId);
        showToast(`${productName} ${currentLang === 'de' ? 'zu Favoriten hinzugefügt' : 'added to favorites'}`, 'success');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateProductCardUI(productId);

    const activeFilter = document.querySelector('.filter-category-btn.active');
    if (activeFilter && activeFilter.id === 'filterFavoritesBtn') {
        filterProducts(null, 'favorites', activeFilter);
    }
}

function updateCartQuantity(productId, change) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const size = 'whole'; 
    let existingItem = cart.find(item => item.product.id === productId && item.size === size);
    let itemAdded = false;

    if (existingItem) {
        existingItem.quantity += change;
        if (existingItem.quantity <= 0) {
            cart = cart.filter(item => !(item.product.id === productId && item.size === size));
            showToast(currentLang === 'de' ? 'Artikel entfernt' : 'Item removed');
        } else if (change > 0) {
            itemAdded = true;
        }
    } else if (change > 0) {
        const newItem = { product, quantity: change, size: size };
        if (product.category === 'bread') newItem.slicing = 'unsliced';
        cart.push(newItem);
        itemAdded = true;
    }

    if (itemAdded) {
        const productName = currentLang === 'de' ? product.name_de : product.name_en;
        showToast(`${productName} ${currentLang === 'de' ? 'hinzugefügt' : 'added'}`, 'success');
        
        const cartIcon = document.getElementById('cartButton');
        if (cartIcon) {
            cartIcon.classList.remove('jiggle');
            void cartIcon.offsetWidth; // Force reflow
            cartIcon.classList.add('jiggle');
        }
    }

    updateCartCount();
}

function addToCartFromModal() {
  if (!currentProductInModal) return;
  const quantity = parseInt(document.getElementById('modalProductQuantity').value);
  if (isNaN(quantity) || quantity < 1) {
    showToast(translations[currentLang].selectProductQuantityAlert, 'error');
    return;
  }
  
  const size = 'whole';
  const slicingChoice = 'unsliced';
  
  let itemInCart = cart.find(item => item.product.id === currentProductInModal.id && item.size === size);
  
  if (itemInCart) {
      itemInCart.quantity += quantity;
  } else {
      cart.push({ product: currentProductInModal, quantity, slicing: slicingChoice, size });
  }

  const productName = currentLang === 'de' ? currentProductInModal.name_de : currentProductInModal.name_en;
  showToast(`${quantity} x ${productName} ${currentLang === 'de' ? 'hinzugefügt' : 'added'}`, 'success');
  
  const cartIcon = document.getElementById('cartButton');
  if (cartIcon) {
      cartIcon.classList.remove('jiggle');
      void cartIcon.offsetWidth; // Force reflow
      cartIcon.classList.add('jiggle');
  }
  
  updateCartCount();
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
        updateCartCount();
    }
}

function emptyCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    showToast(translations[currentLang].cartEmptied);
}

function adjustCartQuantity(itemIndex, change) {
    if (!cart[itemIndex]) return;

    cart[itemIndex].quantity += change;

    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
    }
    
    updateCartCount();
    renderCartItems();
}


function renderCartItems() {
  const selectedProductsList = document.getElementById('selectedProductsList');
  if (!selectedProductsList) return;
  selectedProductsList.innerHTML = '';
  let totalPrice = 0;
  let totalContainer = orderModal.querySelector('.cart-total');
  
  if (!totalContainer) {
    document.getElementById('cartItemsContainer').insertAdjacentHTML('beforeend', '<div class="cart-total"></div>');
    totalContainer = orderModal.querySelector('.cart-total');
  }
  
  const isCartEmpty = cart.length === 0;
  
  const continueBtn = document.getElementById('continueToFormBtn');
  const emptyCartBtn = document.getElementById('emptyCartBtn');
  if (continueBtn) {
      continueBtn.disabled = isCartEmpty;
      emptyCartBtn.style.display = isCartEmpty ? 'none' : 'inline-block';
  }

  if (isCartEmpty) {
    selectedProductsList.innerHTML = `<p style="text-align:center;">${translations[currentLang].noProductsAddedAlert}</p>`;
    totalContainer.style.display = 'none';
  } else {
    totalContainer.style.display = 'flex';
    cart.forEach((item, index) => {
      const pricePerItem = (item.size === 'half' && item.product.price_half) ? item.product.price_half : item.product.price;
      const itemPrice = pricePerItem * item.quantity;
      totalPrice += itemPrice;

      let optionsHtml = '';
      
      if (item.product.canBeHalved) {
          const halfText = translations[currentLang].sizeHalf;
          optionsHtml += `
            <div class="cart-item-option-group">
                <input type="checkbox" id="sizeHalf-${index}" onchange="updateSizePreference(${index}, this.checked)" ${item.size === 'half' ? 'checked' : ''}>
                <label for="sizeHalf-${index}">${halfText}</label>
            </div>`;
      }
      
      if (item.product.category === 'bread') {
          const slicedText = translations[currentLang].slicingSliced;
          optionsHtml += `
            <div class="cart-item-option-group">
                <input type="checkbox" id="sliceYes-${index}" onchange="updateSlicingPreference(${index}, this.checked)" ${item.slicing === 'sliced' ? 'checked' : ''}>
                <label for="sliceYes-${index}">${slicedText}</label>
            </div>`;
      }
      
      const productName = currentLang === 'de' ? item.product.name_de : item.product.name_en;
      const isTrash = item.quantity === 1 ? 'is-trash' : '';
      const decreaseIcon = item.quantity === 1 ? 'fa-times' : 'fa-minus';

      selectedProductsList.innerHTML += `
        <div class="cart-item-row">
            <img src="${item.product.img}" alt="${productName}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-name">${productName}</div>
                <div class="cart-item-price">${itemPrice.toFixed(2)} €</div>
                <div class="cart-item-options-container">
                    ${optionsHtml}
                </div>
            </div>
            <div class="cart-item-controls">
                <div class="cart-quantity-selector">
                    <button class="quantity-btn-cart ${isTrash}" aria-label="Decrease quantity" onclick="adjustCartQuantity(${index}, -1)">
                        <i class="fas ${decreaseIcon}"></i>
                    </button>
                    <span class="quantity-display-cart">${item.quantity}</span>
                    <button class="quantity-btn-cart" aria-label="Increase quantity" onclick="adjustCartQuantity(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>`;
    });
    totalContainer.innerHTML = `<span>${translations[currentLang].totalText}</span><span>${totalPrice.toFixed(2)} €</span>`;
  }
  validateCartAgainstPickupDate();
}


function setMinimumDateTime() {
    const now = new Date();
    const pickupDateInput = document.getElementById('pickupDate');
    if (!pickupDateInput) return;
    const minDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    pickupDateInput.min = minDate;
    if (pickupDateInput.value < minDate) pickupDateInput.value = minDate;
}

function populatePickupHours() {
    const pickupTimeSelect = document.getElementById('pickupTime');
    const pickupDateInput = document.getElementById('pickupDate');
    if (!pickupTimeSelect || !pickupDateInput) return;

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
    const submitBtn = document.getElementById('submitOrderBtn');
    const pickupDateInput = document.getElementById('pickupDate');
    
    if (!pickupDateInput || !messageContainer || !submitBtn) return true;

    if (!pickupDateInput.value) {
        messageContainer.textContent = '';
        return true;
    }
    const hasHolidayItem = cart.some(item => item.product.availability === 'holiday');
    const selectedDate = new Date(`${pickupDateInput.value}T00:00:00`);
    const isHolidayOrSunday = selectedDate.getDay() === 0 || isPublicHoliday(selectedDate);
    if (hasHolidayItem && !isHolidayOrSunday) {
        messageContainer.textContent = translations[currentLang].holidayProductOnNonHolidayAlert;
        if(submitBtn) submitBtn.disabled = true;
        return false;
    }
    messageContainer.textContent = '';
    if(submitBtn) submitBtn.disabled = false;
    return true;
}

function handleDateChange() {
    populatePickupHours();
    validateCartAgainstPickupDate();
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
        alert(translations[currentLang].holidayProductOnNonHolidayAlert);
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
    
    const newOrder = { orderId, name, phone, pickupDate, pickupTime, cart: [...cart] };
    
    // Save the current order for the thank-you page to read.
    localStorage.setItem('lastOrder', JSON.stringify(newOrder));
    
    pastOrders.push(newOrder);
    localStorage.setItem('pastOrders', JSON.stringify(pastOrders));
    
    const cartSummary = cart.map(item => {
        let optionText = '';
        if (item.slicing === 'sliced') {
            optionText += ` (${translations[currentLang].slicingSliced})`;
        }

        let displayQuantity = item.quantity;
        if (item.size === 'half') {
            displayQuantity = item.quantity * 0.5;
        }

        const pricePerItem = (item.size === 'half' && item.product.price_half) ? item.product.price_half : item.product.price;
        const itemPrice = pricePerItem * item.quantity;
        
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
Bestelldetails:
${cartSummary}
Gesamt: ${total} €
--------------------------------
Nachricht: ${userMessage}`;
    const dataToSend = new FormData();
    dataToSend.append('access_key', formData.get('access_key'));
    dataToSend.append('subject', ` Bestellung : #${orderId} `);
    dataToSend.append('from_name', name);
    dataToSend.append('text', emailBody);
    submitBtn.disabled = true;
    submitBtn.textContent = currentLang === 'de' ? 'Wird gesendet...' : 'Sending...';
    fetch(form.action, {
        method: form.method,
        body: dataToSend,
        headers: { 'Accept': 'application/json' }
    }).then(response => {
        if (response.ok) {
            window.location.href = 'thank-you.html';
        } else {
            response.json().then(data => {
                if (Object.hasOwn(data, 'errors')) {
                    alert(data["errors"].map(error => error["message"]).join(", "));
                } else {
                    alert(currentLang === 'de' ? 'Ein Fehler ist aufgetreten.' : 'An error occurred.');
                }
            })
        }
    }).catch(error => {
        console.error('Error:', error);
        alert(currentLang === 'de' ? 'Die Bestellung konnte nicht gesendet werden.' : 'The order could not be sent.');
    }).finally(() => {
        submitBtn.disabled = false;
        applyLanguage();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    showSkeletonLoaders();
    fetch('Products.json')
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
        .then(data => {
            products = data;
            setTimeout(() => {
                filterProducts(null, 'all', document.querySelector('.filter-category-btn'));
            }, 500);
        })
        .catch(error => {
            console.error('Could not load products:', error);
            productGrid.innerHTML = '<p>Products could not be loaded.</p>';
        });

    productGrid.addEventListener('click', (event) => {
        const target = event.target;
        const productContainer = target.closest('.product[data-product-id]');
        if (!productContainer) return;

        const productId = parseInt(productContainer.dataset.productId);

        const controlsContainer = target.closest('.card-cart-controls');
        if (controlsContainer) {
            const button = target.closest('[data-action]');
            if (button) {
                const action = button.dataset.action;
                const change = (action === 'decrease') ? -1 : 1;
                updateCartQuantity(productId, change);
            }
            return;
        }
        
        const favButton = target.closest('.favorite-btn');
        if (favButton) {
            toggleFavorite(productId);
            return;
        }

        const imageContainer = target.closest('.product-image-container');
        if (imageContainer) {
            openModal(productId);
        }
    });

    const categoryDropdownBtn = document.getElementById('categoryDropdownBtn');
    const categoryDropdownMenu = document.getElementById('categoryDropdownMenu');

    categoryDropdownBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        categoryDropdownMenu.classList.toggle('is-open');
        categoryDropdownBtn.classList.toggle('active');
    });

    document.addEventListener('click', (event) => {
        if (!categoryDropdownBtn.contains(event.target)) {
            categoryDropdownMenu.classList.remove('is-open');
            categoryDropdownBtn.classList.remove('active');
        }
    });

    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', submitOrder);
    }
    
    const emptyCartButton = document.getElementById('emptyCartBtn');
    if(emptyCartButton) {
        emptyCartButton.addEventListener('click', emptyCart);
    }

    const pastOrdersButton = document.getElementById('pastOrdersBtn');
    if (pastOrdersButton) {
        pastOrdersButton.addEventListener('click', openPastOrdersModal);
    }

    const footerFavoritesLink = document.getElementById('footerFavoritesLink');
    if(footerFavoritesLink) {
        footerFavoritesLink.addEventListener('click', (e) => {
            const favFilterBtn = document.getElementById('filterFavoritesBtn');
            filterProducts(e, 'favorites', favFilterBtn);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    applyLanguage();
    updateCartCount();
});
