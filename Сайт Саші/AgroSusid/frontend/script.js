const API_KEY = '5bd3c068a172a29750460b903b10281c'; // <--- Вставте свій ключ тут

const products = [
    { id: 1, name: "Екстраклін", price: 43, category: "herbicides", img: "https://via.placeholder.com/200", desc: "Гербіцид суцільної дії" },
    { id: 2, name: "Пантера", price: 165, category: "herbicides", img: "https://via.placeholder.com/200", desc: "Від злакових бур'янів" },
    { id: 3, name: "Добриво NPK", price: 850, category: "fertilizers", img: "https://via.placeholder.com/200", desc: "Комплексне живлення" },
    { id: 4, name: "Насіння Кукурудзи", price: 1100, category: "seeds", img: "https://via.placeholder.com/200", desc: "Гібрид" }
];

const categoryNames = { 'all': 'Всі товари', 'herbicides': 'Гербіциди', 'seeds': 'Насіння', 'fertilizers': 'Добрива' };
let cart = JSON.parse(localStorage.getItem('agro_cart')) || [];

function renderProducts(data = products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = data.map(p => `
        <div class="product-card">
            <img src="${p.img}" onclick="viewProduct(${p.id})">
            <h3>${p.name}</h3>
            <div class="card-price">${p.price} грн.</div>
            <div class="qty-control-wrapper">
                <div class="qty-stepper">
                    <button onclick="changeMainQty(${p.id}, -1)">–</button>
                    <input type="text" id="q-${p.id}" value="1" readonly>
                    <button onclick="changeMainQty(${p.id}, 1)">+</button>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${p.id})">🛒 Додати</button>
            </div>
        </div>
    `).join('');
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    let total = 0, count = 0;

    list.innerHTML = cart.length === 0 ? '<div style="text-align:center;color:#999;margin-top:40px;">Кошик порожній</div>' :
        cart.map(item => {
            const itemSum = item.price * item.qty;
            total += itemSum;
            count += item.qty;
            return `
            <div class="cart-item">
                <div class="item-header">
                    <span class="item-name">${item.name}</span>
                    <span class="unit-price">${item.price} грн/шт</span>
                </div>
                <div class="item-actions">
                    <div class="qty-stepper mini">
                        <button onclick="changeCartQty(${item.id}, -1)">–</button>
                        <span class="qty-display">${item.qty}</span>
                        <button onclick="changeCartQty(${item.id}, 1)">+</button>
                    </div>
                    <div class="item-total-price">${itemSum} грн</div>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">✕</button>
            </div>`;
        }).join('');

    document.getElementById('cart-total').innerText = total;
    document.getElementById('cart-count').innerText = count;
}

// Пошук міст НП
async function searchCity() {
    const val = document.getElementById('city-input').value;
    const resDiv = document.getElementById('city-results');
    if (val.length < 2) { resDiv.style.display = 'none'; return; }

    const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        body: JSON.stringify({
            apiKey: API_KEY, modelName: "Address", calledMethod: "getCities",
            methodProperties: { FindByString: val }
        })
    });
    const d = await res.json();
    if (d.data.length > 0) {
        resDiv.style.display = 'block';
        resDiv.innerHTML = d.data.map(c => `<div class="city-item" onclick="selectCity('${c.Description}', '${c.Ref}')">${c.Description}</div>`).join('');
    }
}

function selectCity(name, ref) {
    document.getElementById('city-input').value = name;
    document.getElementById('selected-city-ref').value = ref;
    document.getElementById('city-results').style.display = 'none';
    loadWarehouses(ref);
}

async function loadWarehouses(ref) {
    const type = document.getElementById('delivery-type').value;
    const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
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

// Допоміжні функції
function changeMainQty(id, d) {
    const inp = document.getElementById(`q-${id}`);
    let val = parseInt(inp.value) + d;
    if (val >= 1) inp.value = val;
}
function changeCartQty(id, d) {
    const item = cart.find(x => x.id === id);
    if (item) { item.qty += d; if (item.qty < 1) return removeFromCart(id); saveCart(); }
}
function addToCart(id) {
    const p = products.find(x => x.id === id);
    const q = parseInt(document.getElementById(`q-${id}`).value);
    const inCart = cart.find(x => x.id === id);
    if (inCart) inCart.qty += q; else cart.push({ ...p, qty: q });
    saveCart();
    toggleCart(true);
}
function removeFromCart(id) { cart = cart.filter(x => x.id !== id); saveCart(); }
function saveCart() { localStorage.setItem('agro_cart', JSON.stringify(cart)); updateCartUI(); }
function toggleCart(s) { document.getElementById('cart-drawer').classList.toggle('open', s); }
function openOrderForm() {
    if (cart.length === 0) return alert("Кошик порожній!");
    document.getElementById('order-modal').style.display = 'block';
    document.getElementById('modal-total-sum').innerText = document.getElementById('cart-total').innerText;
}
function closeOrderForm() { document.getElementById('order-modal').style.display = 'none'; }
function filterProducts(cat) {
    const f = cat === 'all' ? products : products.filter(x => x.category === cat);
    renderProducts(f);
    document.getElementById('category-title').innerText = categoryNames[cat];
}

renderProducts();
updateCartUI();