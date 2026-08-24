const WHATSAPP_NUMBER = '50496278653'; // ajusta si necesitas otro prefijo

let products = [];
const productsContainer = document.getElementById('products-container');
let cart = [];
let currentFilter = 'all';

function formatPriceVal(v) {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    return n;
}

function formatPriceText(n) {
    return `L. ${n}`;
}

function renderProducts() {
    productsContainer.innerHTML = '';
    products.forEach((product, index) => {
        // Filtrar por categoría: si hay filtro distinto de 'all', mostrar sólo si la categoría coincide
        if (currentFilter !== 'all') {
            if (!product.category || product.category !== currentFilter) return;
        }

        const imgHtml = product.image ? `<img src="${product.image}" alt="${product.name}" style="width:100%;height:200px;object-fit:cover;">` : '🧴';
        const priceFull = product.price_full_num ?? formatPriceVal(product.price_full ?? product.price);
        const price5 = product.price_5ml_num ?? formatPriceVal(product.price_5ml);
        const price10 = product.price_10ml_num ?? formatPriceVal(product.price_10ml);

        const card = document.createElement('div');
        card.classList.add('product-card');
        card.innerHTML = `
            <div class="product-image">${imgHtml}</div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description || ''}</p>
                <div class="product-price">Precio frasco: ${priceFull ? formatPriceText(priceFull) : '—'}</div>
                <div style="margin-top:8px;opacity:0.85;">5 ml: ${price5 ? formatPriceText(price5) : '—'} · 10 ml: ${price10 ? formatPriceText(price10) : '—'}</div>
                <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
                    <select class="presentation-select" data-index="${index}">
                        <option value="full" data-price="${priceFull}">Frasco completo — ${priceFull ? formatPriceText(priceFull) : '—'}</option>
                        <option value="5ml" data-price="${price5}">5 ml — ${price5 ? formatPriceText(price5) : '—'}</option>
                        <option value="10ml" data-price="${price10}">10 ml — ${price10 ? formatPriceText(price10) : '—'}</option>
                    </select>
                        <button class="button add-btn" data-index="${index}">AGREGAR</button>
                        <button class="accept-btn" data-index="${index}">Aceptar</button>
                </div>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    countEl.textContent = totalQty;
    const f = document.getElementById('floating-count');
    if (f) f.textContent = totalQty;
}

// Toast notifications (simple)
function showToast(message, timeout = 2000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    container.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 300);
    }, timeout);
}

function renderCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';

    let total = 0;

    cart.forEach(item => {
        const prod = products[item.index];
        const priceNum = item.price;
        total += priceNum * item.qty;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="info">
                <strong>${prod.name}</strong>
                <div style="opacity:0.7;">${prod.description || ''}</div>
                <div style="opacity:0.8;">Presentación: ${item.presentation}</div>
            </div>
            <div style="text-align:right;">
                <div>${formatPriceText(priceNum)}</div>
                <div class="qty-controls">
                    <button class="button qty-decrease" data-index="${item.index}" data-pres="${item.presentation}">-</button>
                    <span style="min-width:22px;display:inline-block;text-align:center;">${item.qty}</span>
                    <button class="button qty-increase" data-index="${item.index}" data-pres="${item.presentation}">+</button>
                </div>
                <div>
                    <button class="remove-btn" data-index="${item.index}" data-pres="${item.presentation}">Eliminar</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('cart-total').textContent = formatPriceText(total);
    updateCartCount();
}

function addToCart(index, presentation, price) {
    // usar index+presentation para diferenciar presentaciones
    const key = index + '::' + presentation;
    const existing = cart.find(i => i.key === key);
    if (existing) existing.qty += 1;
    else cart.push({ key, index, presentation, price, qty: 1 });
    renderCart();
    const prod = products[index];
    showToast(`${prod.name || 'Producto'} agregado al carrito`);
}

function changeQtyByKey(key, delta) {
    const item = cart.find(i => i.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty < 1) cart = cart.filter(i => i.key !== key);
    renderCart();
}

function removeByKey(key) {
    cart = cart.filter(i => i.key !== key);
    renderCart();
}

// Delegación: agregar desde productos
productsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-btn');
    if (!btn) return;
    const index = parseInt(btn.dataset.index, 10);
    const select = document.querySelector(`.presentation-select[data-index="${index}"]`);
    const opt = select.options[select.selectedIndex];
    const presentation = opt.value;
    const price = formatPriceVal(opt.dataset.price || opt.getAttribute('data-price'));
    if (!price) return alert('Precio no disponible para la presentación seleccionada.');
    addToCart(index, presentation, price);
});

// Delegación para el botón Aceptar: confirma selección y muestra feedback breve
productsContainer.addEventListener('click', (e) => {
    const acc = e.target.closest('.accept-btn');
    if (!acc) return;
    const index = parseInt(acc.dataset.index, 10);
    const select = document.querySelector(`.presentation-select[data-index="${index}"]`);
    const opt = select.options[select.selectedIndex];
    const presentation = opt.value;
    showToast(`Seleccionado: ${presentation}`);
});

// Carrito (modal)
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart');

cartButton.addEventListener('click', () => {
    cartModal.setAttribute('aria-hidden', 'false');
    renderCart();
});

closeCartBtn.addEventListener('click', () => {
    cartModal.setAttribute('aria-hidden', 'true');
});

cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) cartModal.setAttribute('aria-hidden', 'true');
});

// Delegación dentro del carrito
document.getElementById('cart-items').addEventListener('click', (e) => {
    const dec = e.target.closest('.qty-decrease');
    const inc = e.target.closest('.qty-increase');
    const rem = e.target.closest('.remove-btn');
    if (dec) {
        const parent = dec.closest('.cart-item');
        const key = cart.find(i => i.index == dec.dataset.index && i.presentation == dec.dataset.pres)?.key;
        if (key) changeQtyByKey(key, -1);
    }
    if (inc) {
        const key = cart.find(i => i.index == inc.dataset.index && i.presentation == inc.dataset.pres)?.key;
        if (key) changeQtyByKey(key, 1);
    }
    if (rem) {
        const key = cart.find(i => i.index == rem.dataset.index && i.presentation == rem.dataset.pres)?.key;
        if (key) removeByKey(key);
    }
});

// Checkout por WhatsApp
document.getElementById('checkout-button').addEventListener('click', () => {
    if (cart.length === 0) return alert('El carrito está vacío.');

    let total = 0;
    let message = 'Hola! Quisiera hacer el siguiente pedido:%0A';

    cart.forEach(item => {
        const prod = products[item.index];
        total += item.price * item.qty;
        message += `- ${item.qty} x ${prod.name} (${item.presentation}) — L. ${item.price}%0A`;
    });

    message += `%0ATotal: L. ${total}%0A%0ADatos de entrega (nombre, dirección, teléfono): `;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
});

// Cargar productos desde products.json
async function init() {
    try {
        const res = await fetch('products.json');
        if (res.ok) products = await res.json();
    } catch (err) {
        console.warn('No se pudo cargar products.json, usando lista vacía.', err);
    }
    renderProducts();

    // Inicializar filtros UI
    const filterBtns = document.querySelectorAll('.catalog-filter .filter-btn');
    filterBtns.forEach(b => {
        b.addEventListener('click', () => {
            setFilter(b.dataset.filter);
        });
    });

    // Click en tarjetas de categoría para filtrar
    const catCards = document.querySelectorAll('.category-card');
    catCards.forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.dataset.category || 'all';
            setFilter(cat);
            // scroll to catalog
            document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
        });
    });
    // marcar botón 'Todos' por defecto
    setFilter('all');
    // floating cart
    const floatingBtn = document.getElementById('floating-cart');
    const floatingCount = document.getElementById('floating-count');
    function updateFloatingVisibility() {
        if (!floatingBtn) return;
        const shouldShow = window.scrollY > 50;
        floatingBtn.classList.toggle('show', shouldShow);
    }
    window.addEventListener('scroll', updateFloatingVisibility);
    updateFloatingVisibility();

    if (floatingBtn) {
        floatingBtn.addEventListener('click', () => {
            cartModal.setAttribute('aria-hidden', 'false');
            renderCart();
        });
    }
}

init();

function setFilter(filter) {
    currentFilter = filter;
    // actualizar estado visual
    document.querySelectorAll('.catalog-filter .filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === filter);
    });
    renderProducts();
}