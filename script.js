// Global state variables
let products = []; // Holds all products fetched from JSON
let currentLang = localStorage.getItem('bakeryLang') || 'de'; // Remembers language
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentProductInModal = null;
let currentPage = 1;
const productsPerPage = 12;
let currentFilteredProducts = [];

// DOM element references
const modal = document.getElementById('modal');
const orderModal = document.getElementById('orderModal');
const productGrid = document.getElementById('productGrid');
const cartCountSpan = document.getElementById('cartCount');
const pickupDateInput = document.getElementById('pickupDate');
const pickupTimeSelect = document.getElementById('pickupTime');
const paginationContainer = document.getElementById('paginationContainer');

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
    holidaySpecials: 'Sonn- & Feiertags',
    orderTitle: 'Deine Bestellung', submitBtn: 'Absenden', contactTitle: 'Kontakt & Öffnungszeiten', addressLabel: 'Adresse:', phoneLabel: 'Telefon:', emailLabel: 'E-Mail:',
    openingHoursTitle: 'Öffnungszeiten', openingHoursWeekday: 'Montag – Samstag: 7:00 – 19:00 Uhr', openingHoursSunday: 'Sonntag: 8:00 – 12:00 Uhr',
    selectProductQuantityAlert: 'Bitte gib eine gültige Menge ein.', noProductsAddedAlert: 'Dein Warenkorb ist leer.',
    addAtLeastOneProductAlert: 'Bitte füge mindestens ein Produkt zum Warenkorb hinzu.', providePhoneNumberAlert: 'Bitte gib deine Telefonnummer an, um die Bestellung abzuschicken.',
    orderSuccessAlert: 'Vielen Dank für deine Bestellung! Wir haben sie erhalten.', newOrderEmailSubject: 'Neue Bäckerei Bestellung', newOrderEmailBodyTitle: 'Neue Bestellung:',
    nameEmailBody: 'Name:', emailEmailBody: 'E-Mail:', phoneEmailBody: 'Telefon:', productsEmailBody: 'Produkte:', messageEmailBody: 'Nachricht:',
    pickupDateLabel: 'Abholdatum:', pickupTimeLabel: 'Abholzeit:',
    pickupTimeInvalid: 'Bitte wähle eine Abholzeit innerhalb der Öffnungszeiten (Mo-Sa: 7-19 Uhr, So: 8-12 Uhr).', pickupTimePast: 'Die gewählte Abholzeit liegt in der Vergangenheit.',
    addToCartBtn: 'Zum Warenkorb', yourCart: 'Dein Warenkorb', searchPlaceholder: 'Gib ein, was du suchst...', yourName: 'Dein Name', phoneNumber: 'Telefonnummer',
    emailOptional: 'E-Mail (optional)', messageOptional: 'Nachricht (optional)', notProvided: 'Nicht angegeben', totalText: 'Gesamt:',
    prevPage: 'Zurück', nextPage: 'Weiter',
    holidayProductOnNonHolidayAlert: 'Ihre Bestellung enthält Artikel, die nur an Sonn- und Feiertagen erhältlich sind. Bitte wählen Sie einen entsprechenden Tag als Abholdatum.',
    phoneHint: "Bitte nur Zahlen, Leerzeichen oder '+' eingeben.",
    slicingTitle: "Schneide-Präferenz",
    slicingUnsliced: "Am Stück",
    slicingSliced: "Geschnitten"
  },
  en: {
    langSwitch: 'English', mainTitle: 'Macis Organic Bakery in Leipzig', subTitle: 'Traditional Baking, Fresh Every Day',
    orderNowBtn: 'Order Now', allBakedGoods: 'All Baked Goods', bread: 'Bread', rolls: 'Rolls', sweets: 'Sweets', searchBtn: 'Search',
    holidaySpecials: 'Sundays & Holidays',
    orderTitle: 'Your Order', submitBtn: 'Submit', contactTitle: 'Contact & Opening Hours', addressLabel: 'Address:', phoneLabel: 'Phone:', emailLabel: 'Email:',
    openingHoursTitle: 'Opening Hours', openingHoursWeekday: 'Monday – Saturday: 7:00 AM – 7:00 PM', openingHoursSunday: 'Sunday: 8:00 AM – 12:00 PM',
    selectProductQuantityAlert: 'Please enter a valid quantity.', noProductsAddedAlert: 'Your cart is empty.',
    addAtLeastOneProductAlert: 'Please add at least one product to the cart.', providePhoneNumberAlert: 'Please provide your phone number to submit the order.',
    orderSuccessAlert: 'Thank you for your order! We have received it.', newOrderEmailSubject: 'New Bakery Order', newOrderEmailBodyTitle: 'New Order:',
    nameEmailBody: 'Name:', emailEmailBody: 'Email:', phoneEmailBody: 'Phone:', productsEmailBody: 'Products:', messageEmailBody: 'Message:',
    pickupDateLabel: 'Pickup Date:', pickupTimeLabel: 'Pickup Time:',
    pickupTimeInvalid: 'Please select a pickup time within opening hours (Mon-Sat: 7 AM - 7 PM, Sun: 8 AM - 12 PM).', pickupTimePast: 'The selected pickup time is in the past.',
    addToCartBtn: 'Add to Cart', yourCart: 'Your Cart', searchPlaceholder: 'Enter what you are looking for...', yourName: 'Your Name', phoneNumber: 'Phone Number',
    emailOptional: 'E-Mail (optional)', messageOptional: 'Message (optional)', notProvided: 'Not provided', totalText: 'Total:',
    prevPage: 'Previous', nextPage: 'Next',
    holidayProductOnNonHolidayAlert: 'Your order contains Sunday/Holiday-only items. Please select an appropriate day as your pickup date.',
    phoneHint: "Please only enter numbers, spaces, or '+'.",
    slicingTitle: "Slicing Preference",
    slicingUnsliced: "Unsliced",
    slicingSliced: "Sliced"
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

function displayProducts() {
    productGrid.innerHTML = "";
    productGrid.classList.remove('loaded');
    const startIndex = (currentPage - 1) * productsPerPage;
    const paginatedProducts = currentFilteredProducts.slice(startIndex, startIndex + productsPerPage);

    if (currentFilteredProducts.length === 0) {
        const query = document.getElementById('searchInput').value;
        const message = query 
            ? `${currentLang === 'de' ? 'Keine Ergebnisse für' : 'No results for'} "<strong>${query}</strong>"`
            : `${currentLang === 'de' ? 'Keine Produkte in dieser Kategorie gefunden.' : 'No products found in this category.'}`;
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

            const cartItem = cart.find(item => item.product.id === p.id);
            const quantityInCart = cartItem ? cartItem.quantity : 0;
            
            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${p.img}" alt="${currentLang === 'de' ? p.name_de : p.name_en}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/220x220?text=Image+Missing';">
                    ${badgeHtml}
                    ${dietaryHtml}
                </div>
                <div class="product-info">
                    <h3>${currentLang === 'de' ? p.name_de : p.name_en}</h3>
                    <div>
                        <p class="product-price">${p.price.toFixed(2)} €</p>
                        <div class="card-cart-controls">
                            <div class="quantity-selector">
                                <button class="quantity-btn" aria-label="Decrease quantity" data-action="decrease" data-product-id="${p.id}">-</button>
                                <span class="quantity-display" aria-live="polite">${quantityInCart}</span>
                                <button class="quantity-btn" aria-label="Increase quantity" data-action="increase" data-product-id="${p.id}">+</button>
                            </div>
                        </div>
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
    displayProducts();
    setTimeout(() => {
        const productGridTop = productGrid.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: productGridTop, behavior: 'smooth' });
    }, 100);
}

function openModal(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    currentProductInModal = p;
    const cartItem = cart.find(item => item.product.id === p.id);
    document.getElementById('modalProductQuantity').value = cartItem ? cartItem.quantity : 1;
    document.getElementById('modalImg').src = p.img;
    document.getElementById('modalTitle').textContent = currentLang === 'de' ? p.name_de : p.name_en;
    document.getElementById('modalCal').textContent = `${currentLang === 'de' ? 'Kalorien: ca. ' : 'Calories: ca. '}${p.cal} kcal`;
    document.getElementById('modalAllergen').textContent = `${currentLang === 'de' ? 'Allergene: ' : 'Allergens: '}${currentLang === 'de' ? p.allergen_de : p.allergen_en}`;
    const modalDietary = document.getElementById('modalDietary');
    if (p.dietary) {
        modalDietary.innerHTML = `<span class="dietary-badge badge-${p.dietary}">${p.dietary}</span>`;
        modalDietary.style.display = 'block';
    } else {
        modalDietary.style.display = 'none';
    }
    document.getElementById('modalPrice').textContent = `${p.price.toFixed(2)} €`;
    const slicingOptions = document.getElementById('slicingOptionsContainer');
    if (p.category === 'bread') {
        slicingOptions.style.display = 'block';
        document.getElementById('sliceNo').checked = true;
    } else {
        slicingOptions.style.display = 'none';
    }
    modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
  currentProductInModal = null;
}

function openOrderForm() {
  orderModal.style.display = 'flex';
  renderCartItems();
  setMinimumDateTime();
  populatePickupHours();
  validateCartAgainstPickupDate();
}

function closeOrderForm() {
  orderModal.style.display = 'none';
}

function filterProducts(cat, element) {
    document.querySelectorAll('.filter-category-btn').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    currentFilteredProducts = (cat === 'all') ? [...products]
        : (cat === 'holiday') ? products.filter(p => p.availability === 'holiday')
        : products.filter(p => p.category === cat);
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
  const activeFilter = document.querySelector('.filter-category-btn.active') || document.querySelector('.filter-category-btn');
  const category = activeFilter.getAttribute('onclick').match(/'([^']+)'/)[1];
  filterProducts(category, activeFilter);
}

function toggleSearch() {
  const searchBarContainer = document.getElementById('searchBarContainer');
  const isHidden = searchBarContainer.style.display === 'none' || !searchBarContainer.style.display;
  if (isHidden) document.querySelectorAll('.filter-category-btn').forEach(btn => btn.classList.remove('active'));
  searchBarContainer.style.display = isHidden ? 'block' : 'none';
  if (isHidden) document.getElementById('searchInput').focus(); else clearSearch();
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-lang-key]').forEach(el => {
    const key = el.dataset.langKey;
    const translation = translations[currentLang][key];
    if (translation) {
      const icon = el.querySelector('i');
      if (key === 'searchBtn' && icon) el.title = translation;
      else if (key === 'yourCart') {
        const textSpan = el.querySelector('.cart-icon-text');
        if (textSpan) textSpan.textContent = translation;
      } else if (icon) el.innerHTML = `${icon.outerHTML} ${translation}`;
      else el.textContent = translation;
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
  cartCountSpan.textContent = totalItems > 0 ? totalItems : '';
  cartCountSpan.classList.toggle('visible', totalItems > 0);
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateProductCardUI(productId) {
    const productCard = document.querySelector(`.product[data-product-id='${productId}']`);
    if (productCard) {
        const quantityDisplay = productCard.querySelector('.quantity-display');
        const cartItem = cart.find(item => item.product.id === productId);
        if (quantityDisplay) {
            quantityDisplay.textContent = cartItem ? cartItem.quantity : 0;
        }
        productCard.classList.toggle('in-cart', !!cartItem && cartItem.quantity > 0);
    }
}

function updateCartQuantity(productId, change) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    let existingItem = cart.find(item => item.product.id === productId);
    let itemAdded = false;

    if (existingItem) {
        existingItem.quantity += change;
        if (existingItem.quantity <= 0) {
            cart = cart.filter(item => item.product.id !== productId);
            showToast(currentLang === 'de' ? 'Artikel entfernt' : 'Item removed');
        } else if (change > 0) {
            const productName = currentLang === 'de' ? product.name_de : product.name_en;
            showToast(`${productName} ${currentLang === 'de' ? 'hinzugefügt' : 'added'}`, 'success');
            itemAdded = true;
        }
    } else if (change > 0) {
        const newItem = { product, quantity: change };
        if (product.category === 'bread') newItem.slicing = 'unsliced';
        cart.push(newItem);
        const productName = currentLang === 'de' ? product.name_de : product.name_en;
        showToast(`${productName} ${currentLang === 'de' ? 'hinzugefügt' : 'added'}`, 'success');
        itemAdded = true;
    }

    if (itemAdded) {
        const cartButton = document.getElementById('cartButton');
        cartButton.classList.remove('jiggle');
        void cartButton.offsetWidth;
        cartButton.classList.add('jiggle');
    }

    updateCartCount();
    updateProductCardUI(productId);
}

function addToCartFromModal() {
  if (!currentProductInModal) return;
  const quantity = parseInt(document.getElementById('modalProductQuantity').value);
  if (isNaN(quantity) || quantity < 0) {
    showToast(translations[currentLang].selectProductQuantityAlert, 'error');
    return;
  }
  const itemInCart = cart.find(item => item.product.id === currentProductInModal.id);
  let slicingChoice = null;
  if (currentProductInModal.category === 'bread') {
      slicingChoice = document.querySelector('input[name="slicing"]:checked').value;
  }
  
  if (itemInCart) {
      if (quantity <= 0) {
          cart = cart.filter(item => item.product.id !== currentProductInModal.id);
      } else {
          itemInCart.quantity = quantity;
          itemInCart.slicing = slicingChoice;
      }
  } else if (quantity > 0) {
      cart.push({ product: currentProductInModal, quantity, slicing: slicingChoice });
  }

  if (quantity > 0) {
    const productName = currentLang === 'de' ? currentProductInModal.name_de : currentProductInModal.name_en;
    showToast(`${productName} ${currentLang === 'de' ? 'hinzugefügt' : 'added'}`, 'success');
    const cartButton = document.getElementById('cartButton');
    cartButton.classList.remove('jiggle');
    void cartButton.offsetWidth;
    cartButton.classList.add('jiggle');
  } else {
    showToast(currentLang === 'de' ? 'Artikel entfernt' : 'Item removed');
  }
  updateCartCount();
  updateProductCardUI(currentProductInModal.id);
  closeModal();
}

function updateSlicingPreference(itemIndex, newPreference) {
    if (cart[itemIndex]) {
        cart[itemIndex].slicing = newPreference;
        localStorage.setItem('cart', JSON.stringify(cart));
    }
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
  const formElements = document.querySelectorAll('#orderForm input, #orderForm select, #orderForm textarea, #orderForm button[type="submit"]');
  formElements.forEach(el => {
    if (el.type !== 'hidden') el.disabled = isCartEmpty;
  });

  if (isCartEmpty) {
    selectedProductsList.innerHTML = `<p style="text-align:center;">${translations[currentLang].noProductsAddedAlert}</p>`;
    totalContainer.style.display = 'none';
  } else {
    totalContainer.style.display = 'flex';
    cart.forEach((item, index) => {
      const itemPrice = item.product.price * item.quantity;
      totalPrice += itemPrice;
      let optionElement = '';
      if (item.product.category === 'bread') {
          const unslicedText = translations[currentLang].slicingUnsliced;
          const slicedText = translations[currentLang].slicingSliced;
          optionElement = `
            <div class="cart-item-slicing-group">
                <input type="radio" id="sliceNo-${index}" name="slicing-${index}" value="unsliced" onchange="updateSlicingPreference(${index}, this.value)" ${item.slicing === 'unsliced' ? 'checked' : ''}>
                <label for="sliceNo-${index}">${unslicedText}</label>
                <input type="radio" id="sliceYes-${index}" name="slicing-${index}" value="sliced" onchange="updateSlicingPreference(${index}, this.value)" ${item.slicing === 'sliced' ? 'checked' : ''}>
                <label for="sliceYes-${index}">${slicedText}</label>
            </div>`;
      }
      selectedProductsList.innerHTML += `
        <div class="cart-item-row">
          <div class="cart-item-details">
            <span>${currentLang === 'de' ? item.product.name_de : item.product.name_en} × ${item.quantity} (${itemPrice.toFixed(2)} €)</span>
            ${optionElement}
          </div>
          <button type="button" aria-label="Remove item" onclick="removeFromCart(${index})">✖</button>
        </div>`;
    });
    totalContainer.innerHTML = `<span>${translations[currentLang].totalText}</span><span>${totalPrice.toFixed(2)} €</span>`;
  }
  validateCartAgainstPickupDate();
}

function removeFromCart(index) {
  if (!cart[index]) return;
  const productId = cart[index].product.id;
  cart.splice(index, 1);
  renderCartItems();
  updateCartCount();
  updateProductCardUI(productId);
}

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
    const submitBtn = document.getElementById('submitOrderBtn');
    if (!pickupDateInput.value) {
        if (!submitBtn.disabled) submitBtn.disabled = false;
        messageContainer.textContent = '';
        return true;
    }
    const hasHolidayItem = cart.some(item => item.product.availability === 'holiday');
    const selectedDate = new Date(`${pickupDateInput.value}T00:00:00`);
    const isHolidayOrSunday = selectedDate.getDay() === 0 || isPublicHoliday(selectedDate);
    if (hasHolidayItem && !isHolidayOrSunday) {
        messageContainer.textContent = translations[currentLang].holidayProductOnNonHolidayAlert;
        submitBtn.disabled = true;
        return false;
    }
    messageContainer.textContent = '';
    if (cart.length > 0) submitBtn.disabled = false;
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
    const lastOrder = { orderId, name, phone, pickupDate, pickupTime, cart };
    localStorage.setItem('lastOrder', JSON.stringify(lastOrder));
    const cartSummary = cart.map(item => {
        let optionText = '';
        if (item.slicing) {
            const key = item.slicing === 'sliced' ? 'slicingSliced' : 'slicingUnsliced';
            optionText = ` (${translations[currentLang][key]})`;
        }
        return `${item.quantity} x ${currentLang === 'de' ? item.product.name_de : item.product.name_en}${optionText} (${(item.product.price * item.quantity).toFixed(2)} €)`;
    }).join('\n');
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2);
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
    dataToSend.append('subject', `Neue Bäckerei-Bestellung #${orderId} von ${name}`);
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
    productGrid.innerHTML = '<div class="loading-spinner"></div>';
    fetch('Products.json')
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
        .then(data => {
            products = data;
            filterProducts('all', document.querySelector('.filter-category-btn'));
        })
        .catch(error => {
            console.error('Could not load products:', error);
            productGrid.innerHTML = '<p>Products could not be loaded.</p>';
        });

    productGrid.addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('.quantity-btn')) {
            const action = target.dataset.action;
            const productId = parseInt(target.dataset.productId);
            if (action === 'increase') updateCartQuantity(productId, 1);
            else if (action === 'decrease') updateCartQuantity(productId, -1);
            return;
        }
        const productCard = target.closest('.product');
        if (productCard) openModal(parseInt(productCard.dataset.productId));
    });

    document.getElementById('orderForm').addEventListener('submit', submitOrder);
    applyLanguage();
    updateCartCount();
});