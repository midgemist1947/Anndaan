/* =====================================================================
   DOSSIER — shop logic
   Sections below: 1) product data  2) cart state  3) rendering
   4) drawer / modal controls  5) checkout + Razorpay  6) misc/init
   ===================================================================== */

/* ---------------------------------------------------------------------
   1) PRODUCT DATA
   Edit this list to change what's for sale. Prices are in rupees.
   --------------------------------------------------------------------- */
const PRODUCTS = [
  {
    id: "atlas-ui",
    name: "Atlas UI Kit",
    ext: ".FIGMA",
    icon: "layers",
    tab: "marigold",
    price: 1499,
    desc: "120+ components for product teams, built around Figma's auto layout.",
  },
  {
    id: "async-playbook",
    name: "The Async Playbook",
    ext: ".PDF",
    icon: "doc",
    tab: "clay",
    price: 399,
    desc: "A 64-page field guide to running a remote team without the meetings.",
  },
  {
    id: "motion-foundations",
    name: "Motion Foundations",
    ext: ".MP4",
    icon: "play",
    tab: "teal",
    price: 2499,
    desc: "Three hours of video on animation principles for interface designers.",
  },
  {
    id: "ledger-pro",
    name: "Ledger Pro",
    ext: ".ZIP",
    icon: "archive",
    tab: "teal",
    price: 799,
    desc: "A spreadsheet system for freelancers to track invoices and tax set-asides.",
  },
  {
    id: "brandmark-pack",
    name: "Brandmark Pack",
    ext: ".AI",
    icon: "pen",
    tab: "marigold",
    price: 999,
    desc: "40 editable logo marks, plus a one-page guide for using them well.",
  },
  {
    id: "strategy-session",
    name: "1:1 Strategy Session",
    ext: ".CAL",
    icon: "calendar",
    tab: "clay",
    price: 3999,
    desc: "A 45-minute call to pressure-test your product, pricing or positioning.",
  },
];

const TAB_COLORS = {
  marigold: { color: "var(--marigold)", tint: "rgba(232,163,61,.18)" },
  clay: { color: "var(--clay)", tint: "rgba(193,84,44,.16)" },
  teal: { color: "var(--teal)", tint: "rgba(63,140,130,.18)" },
};

const ICONS = {
  doc: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16.5h6M9 9.5h2"/></svg>`,
  play: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M11 9.5l4.5 2.5-4.5 2.5z"/></svg>`,
  layers: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5-8 4.5-8-4.5z"/><path d="M4 12l8 4.5 8-4.5"/><path d="M4 16.5l8 4.5 8-4.5"/></svg>`,
  archive: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="16" height="13" rx="1.5"/><path d="M4 7l1.5-3h13L20 7"/><path d="M12 11v5M12 11l-1.6 1.6M12 11l1.6 1.6"/></svg>`,
  pen: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17c3-7 6-10.5 10-13"/><circle cx="4.5" cy="17.5" r="1.5"/><circle cx="14" cy="4" r="1.5"/><path d="M11 9l4 4"/></svg>`,
  calendar: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8.5 14l2 2 4-4.2"/></svg>`,
};

/* ---------------------------------------------------------------------
   2) CART STATE
   In-memory only — refreshing the page clears the cart. Swap in
   localStorage here later if you want the cart to persist.
   --------------------------------------------------------------------- */
const cart = {}; // { [productId]: quantity }

function cartItems() {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id), qty }));
}

function cartSubtotal() {
  return cartItems().reduce((sum, { product, qty }) => sum + product.price * qty, 0);
}

function cartCount() {
  return cartItems().reduce((sum, { qty }) => sum + qty, 0);
}

function formatPrice(n) {
  return "₹" + n.toLocaleString("en-IN");
}

/* ---------------------------------------------------------------------
   3) RENDERING
   --------------------------------------------------------------------- */
const productGrid = document.getElementById("product-grid");
const cartCountEl = document.getElementById("cart-count");
const cartItemsEl = document.getElementById("cart-items");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const checkoutBtn = document.getElementById("checkout-btn");

function productActionHTML(product) {
  const qty = cart[product.id] || 0;
  if (qty === 0) {
    return `<button class="add-btn" data-action="add" data-id="${product.id}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      Add
    </button>`;
  }
  return `<div class="qty-stepper">
    <button data-action="dec" data-id="${product.id}" aria-label="Remove one">–</button>
    <span>${qty}</span>
    <button data-action="inc" data-id="${product.id}" aria-label="Add one more">+</button>
  </div>`;
}

function renderProducts() {
  productGrid.innerHTML = PRODUCTS.map((p) => {
    const tab = TAB_COLORS[p.tab];
    return `
      <article class="product-card" data-ext="${p.ext}" style="--tab-color:${tab.color}; --tab-tint:${tab.tint}">
        <div class="product-icon">${ICONS[p.icon]}</div>
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        <div class="product-foot">
          <span class="price">${formatPrice(p.price)}</span>
          <span id="action-${p.id}">${productActionHTML(p)}</span>
        </div>
      </article>`;
  }).join("");
}

function refreshProductAction(id) {
  const product = PRODUCTS.find((p) => p.id === id);
  const el = document.getElementById(`action-${id}`);
  if (el) el.innerHTML = productActionHTML(product);
}

function renderCart() {
  const items = cartItems();

  cartCountEl.textContent = cartCount();
  cartSubtotalEl.textContent = formatPrice(cartSubtotal());
  checkoutBtn.disabled = items.length === 0;

  if (items.length === 0) {
    cartItemsEl.innerHTML = `<p class="cart-empty">Nothing filed yet. Add something from the catalog.</p>`;
    return;
  }

  cartItemsEl.innerHTML = items
    .map(({ product, qty }) => {
      const tab = TAB_COLORS[product.tab];
      return `
        <div class="cart-row">
          <div class="cart-row-icon" style="--tab-color:${tab.color}; --tab-tint:${tab.tint}">${ICONS[product.icon]}</div>
          <div class="cart-row-body">
            <h4>${product.name}</h4>
            <div class="cart-row-foot">
              <span class="cart-row-price">${qty} × ${formatPrice(product.price)}</span>
              <button class="cart-remove" data-action="remove" data-id="${product.id}">Remove</button>
            </div>
          </div>
        </div>`;
    })
    .join("");
}

function setQty(id, qty) {
  cart[id] = Math.max(0, qty);
  refreshProductAction(id);
  renderCart();
}

/* Clicks inside the product grid (event delegation) */
productGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  const current = cart[id] || 0;
  if (action === "add" || action === "inc") setQty(id, current + 1);
  if (action === "dec") setQty(id, current - 1);
});

/* Clicks inside the cart drawer */
cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action='remove']");
  if (!btn) return;
  setQty(btn.dataset.id, 0);
});

/* ---------------------------------------------------------------------
   4) DRAWER / MODAL CONTROLS
   --------------------------------------------------------------------- */
const cartDrawer = document.getElementById("cart-drawer");
const drawerBackdrop = document.getElementById("drawer-backdrop");
const checkoutModal = document.getElementById("checkout-modal");
const checkoutBackdrop = document.getElementById("checkout-backdrop");

function openCart() {
  cartDrawer.classList.add("open");
  drawerBackdrop.classList.add("show");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.getElementById("cart-toggle").setAttribute("aria-expanded", "true");
}
function closeCart() {
  cartDrawer.classList.remove("open");
  drawerBackdrop.classList.remove("show");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.getElementById("cart-toggle").setAttribute("aria-expanded", "false");
}

document.getElementById("cart-toggle").addEventListener("click", openCart);
document.getElementById("cart-close").addEventListener("click", closeCart);
drawerBackdrop.addEventListener("click", closeCart);

function openCheckout() {
  if (cartItems().length === 0) return;
  renderReceipt();
  document.getElementById("checkout-form-panel").hidden = false;
  document.getElementById("checkout-success-panel").hidden = true;
  closeCart();
  checkoutModal.classList.add("open");
  checkoutBackdrop.classList.add("show");
  checkoutModal.setAttribute("aria-hidden", "false");
}
function closeCheckout() {
  checkoutModal.classList.remove("open");
  checkoutBackdrop.classList.remove("show");
  checkoutModal.setAttribute("aria-hidden", "true");
}

checkoutBtn.addEventListener("click", openCheckout);
document.getElementById("checkout-close").addEventListener("click", closeCheckout);
checkoutBackdrop.addEventListener("click", closeCheckout);
document.getElementById("success-close").addEventListener("click", closeCheckout);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeCheckout();
  closeCart();
});

function renderReceipt() {
  const items = cartItems();
  const rows = items
    .map(
      ({ product, qty }) => `
      <div class="receipt-row">
        <span>${product.name} × ${qty}</span>
        <span>${formatPrice(product.price * qty)}</span>
      </div>`
    )
    .join("");
  const total = `
    <div class="receipt-row total">
      <span>Total</span>
      <span>${formatPrice(cartSubtotal())}</span>
    </div>`;
  document.getElementById("receipt-lines").innerHTML = rows + total;
}

/* ---------------------------------------------------------------------
   5) CHECKOUT + RAZORPAY
   To go live: paste your Key ID below. That's the only line you need
   to change — everything else is already wired up.
   Find your key at: https://dashboard.razorpay.com/app/keys
   --------------------------------------------------------------------- */
const RAZORPAY_KEY_ID = "YOUR_RAZORPAY_KEY_ID";

document.getElementById("checkout-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("checkout-email").value;
  const amountRupees = cartSubtotal();
  payWithRazorpay(amountRupees, email);
});

function payWithRazorpay(amountRupees, email) {
  const isLive = RAZORPAY_KEY_ID !== "YOUR_RAZORPAY_KEY_ID" && typeof Razorpay !== "undefined";

  if (!isLive) {
    showToast("Demo mode — add your Razorpay key in script.js to take real payments");
    // Simulate the confirmation screen so you can see the full flow today.
    setTimeout(() => showSuccess({ demo: true, email }), 500);
    return;
  }

  // ---- Live path -----------------------------------------------------
  // Note: for production you should create the order server-side first
  // (via the Razorpay Orders API) and pass the resulting order_id below.
  // This client-only version works for simple/test-mode checkouts.
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amountRupees * 100, // Razorpay expects paise
    currency: "INR",
    name: "Dossier",
    description: `${cartCount()} item(s)`,
    prefill: { email },
    theme: { color: "#E8A33D" },
    handler: function (response) {
      showSuccess({ demo: false, email, paymentId: response.razorpay_payment_id });
    },
    modal: {
      ondismiss: function () {
        showToast("Checkout closed — your cart is still here");
      },
    },
  };

  const rzp = new Razorpay(options);
  rzp.on("payment.failed", function () {
    showToast("Payment failed — please try again");
  });
  rzp.open();
}

function showSuccess({ demo, email, paymentId }) {
  document.getElementById("checkout-form-panel").hidden = true;
  document.getElementById("checkout-success-panel").hidden = false;
  document.getElementById("success-copy").textContent = demo
    ? `No payment was taken (demo mode). In production, files would now be on their way to ${email}.`
    : `Payment ${paymentId} received. Your files are on their way to ${email}.`;

  // Clear the cart
  Object.keys(cart).forEach((id) => (cart[id] = 0));
  PRODUCTS.forEach((p) => refreshProductAction(p.id));
  renderCart();
}

/* ---------------------------------------------------------------------
   6) MISC / INIT
   --------------------------------------------------------------------- */
const toastEl = document.getElementById("toast");
let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add("show");
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2800);
}

const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");
navToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
mainNav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    mainNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

document.getElementById("year").textContent = new Date().getFullYear();

renderProducts();
renderCart();
