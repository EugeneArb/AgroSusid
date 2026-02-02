const API_KEY = '5bd3c068a172a29750460b903b10281c';
const API_URL = 'https://api.novaposhta.ua/v2.0/json/';

const products = [
    { id: 1, name: "Екстраклін", price: 43, category: "herbicides", img: "https://via.placeholder.com/200", desc: "Системний гербіцид суцільної дії для знищення бур'янів." },
    { id: 2, name: "Пантера", price: 165, category: "herbicides", img: "https://via.placeholder.com/200", desc: "Селективний гербіцид для захисту широколистяних культур." },
    { id: 3, name: "Добриво NPK", price: 850, category: "fertilizers", img: "https://via.placeholder.com/200", desc: "Високоефективне мінеральне добриво." },
    { id: 4, name: "Насіння Кукурудзи", price: 1100, category: "seeds", img: "https://via.placeholder.com/200", desc: "Гібрид з високим потенціалом врожайності." }
];

let cart = JSON.parse(localStorage.getItem('agro_cart')) || [];

function renderProducts(data = products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = data.map(p => `
        <div class="product-card">
            <div class="img-container" onclick="viewProduct(${p.id})">
                <img src="${p.img}">
            </div>
            <div class="card-info">
                <h3 onclick="viewProduct(${p.id})">${p.name}</h3>
                <div class="card-price">${p.price} грн.</div>
            </div>
            <div class="card-actions">
                <div class="qty-stepper">
                    <button onclick="changeMainQty(${p.id}, -1)">-</button>
                    <input type="text" id="q-${p.id}" value="1" readonly>
                    <button onclick="changeMainQty(${p.id}, 1)">+</button>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${p.id})">🛒 Додати</button>
            </div>
        </div>`).join('');
}

function viewProduct(id) {
    const p = products.find(x => x.id === id);
    localStorage.setItem('selectedProduct', JSON.stringify(p));
    window.location.href = 'product.html';
}

function filterProducts(cat) {
    const grid = document.getElementById('products-grid');
    if (!grid) { window.location.href = 'index.html'; return; }
    const filtered = cat === 'all' ? products : products.filter(p => p.category === cat);
    renderProducts(filtered);
    document.getElementById('category-title').innerText = cat === 'all' ? 'Наші товари' : cat.charAt(0).toUpperCase() + cat.slice(1);
}

// КОШИК
function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    if (!list) return;
    let total = 0;
    list.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        return `
        <div class="cart-item">
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price-unit">${item.price} грн/шт</div>
                <div class="qty-stepper-cart">
                    <button onclick="changeCartQty(${item.id}, -1)">-</button>
                    <span class="qty-val">${item.qty}</span>
                    <button onclick="changeCartQty(${item.id}, 1)">+</button>
                </div>
            </div>
            <div class="item-sum-right">${item.price * item.qty} грн</div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">✕</button>
        </div>`;
    }).join('');
    document.getElementById('cart-total').innerText = total;
    document.getElementById('cart-count').innerText = cart.reduce((a, b) => a + b.qty, 0);
    localStorage.setItem('agro_cart', JSON.stringify(cart));
}

function addToCart(id) {
    const p = products.find(x => x.id === id);
    const q = parseInt(document.getElementById(`q-${id}`).value);
    const inCart = cart.find(x => x.id === id);
    if (inCart) inCart.qty += q; else cart.push({ ...p, qty: q });
    updateCartUI();
    toggleCart(true);
}

function addToCartFromPage(id) {
    const p = products.find(x => x.id === id);
    const inCart = cart.find(x => x.id === id);
    if (inCart) inCart.qty += 1; else cart.push({ ...p, qty: 1 });
    updateCartUI();
    toggleCart(true);
}

// НОВА ПОШТА
async function searchCity() {
    const input = document.getElementById('city-input').value;
    const resDiv = document.getElementById('city-results');
    if (input.length < 2) { resDiv.style.display = 'none'; return; }

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                apiKey: API_KEY, modelName: "Address", calledMethod: "getCities",
                methodProperties: { FindByString: input }
            })
        });
        const d = await res.json();
        resDiv.innerHTML = d.data.map(c => `<div class="city-opt" onclick="selectCity('${c.Description}', '${c.Ref}')">${c.Description}</div>`).join('');
        resDiv.style.display = 'block';
    } catch (e) { console.error("NP Error", e); }
}

function selectCity(name, ref) {
    document.getElementById('city-input').value = name;
    document.getElementById('selected-city-ref').value = ref;
    document.getElementById('city-results').style.display = 'none';
    loadWarehouses(ref);
}

async function loadWarehouses(ref) {
    const type = document.getElementById('delivery-type').value;
    const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
            apiKey: API_KEY, modelName: "Address", calledMethod: "getWarehouses",
            methodProperties: { CityRef: ref }
        })
    });
    const d = await res.json();
    const sel = document.getElementById('warehouse-select');
    sel.disabled = false;
    const filtered = d.data.filter(w => type === 'Postomat' ? w.CategoryOfWarehouse === 'Postomat' : w.CategoryOfWarehouse !== 'Postomat');
    sel.innerHTML = filtered.map(w => `<option value="${w.Description}">${w.Description}</option>`).join('');
}

// ФОРМА ТА МОДАЛКА
function openOrderForm() {
    if (cart.length === 0) return;
    document.getElementById('order-modal').style.display = 'block';
    document.getElementById('modal-total-sum').innerText = document.getElementById('cart-total').innerText;
}

function closeOrderForm(shouldClear) {
    document.getElementById('order-modal').style.display = 'none';
    document.getElementById('final-order-form').reset();
    if (shouldClear) { cart = []; updateCartUI(); toggleCart(false); }
}

function toggleCart(s) { const d = document.getElementById('cart-drawer'); if (d) d.classList.toggle('open', s); }
function removeFromCart(id) { cart = cart.filter(x => x.id !== id); updateCartUI(); }
function changeCartQty(id, d) {
    const item = cart.find(x => x.id === id);
    if (item) { item.qty += d; if (item.qty < 1) return removeFromCart(id); updateCartUI(); }
}
function changeMainQty(id, d) { const i = document.getElementById(`q-${id}`); let v = parseInt(i.value) + d; if (v >= 1) i.value = v; }
function resetNP() { document.getElementById('city-input').value = ''; document.getElementById('warehouse-select').disabled = true; }

// Перевірка редіректу на замовлення
if (window.location.search.includes('openOrder=true')) {
    setTimeout(openOrderForm, 500);
}

renderProducts();
updateCartUI();