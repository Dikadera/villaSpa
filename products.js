/* ==========================================================================
   THE VILLA SPA - SKINCARE BOUTIQUE CONTROLLER
   ========================================================================== */

// Import Firebase SDKs from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, doc, getDocs, setDoc, addDoc, query, orderBy, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// Import configuration settings
import { config } from "./config.js";

// Firebase configuration matching the workspace config
const firebaseConfig = {
  apiKey: "AIzaSyCrvlvcrHw1vq1zrY_oNPHNAvGQIZkhy7E",
  authDomain: "thevillaspa-14b57.firebaseapp.com",
  projectId: "thevillaspa-14b57",
  storageBucket: "thevillaspa-14b57.firebasestorage.app",
  messagingSenderId: "266753549058",
  appId: "1:266753549058:web:d12b9717c4946957f5581b",
  measurementId: "G-6XN6XK5RB2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default skincare products for database seeding
const defaultSkincare = [
  { id: "product-glowserum", category: "serums", name: "TVS Hydrating Glow Serum", price: 18000, desc: "A potent hyaluronic acid and vitamin C formulation to restore skin moisture, reduce fine lines, and promote a dewy, glowing complexion.", stock: "in-stock", image: "" },
  { id: "product-cleanser", category: "cleansers", name: "TVS Charcoal Detox Cleanser", price: 12000, desc: "Formulated with activated charcoal and aloe extract to draw out skin impurities, refine pores, and balance oils without over-stripping.", stock: "in-stock", image: "" },
  { id: "product-toner", category: "toners", name: "TVS Melanin-Control Toner", price: 15000, desc: "Balances skin pH, eliminates cellular residues, and uses gentle AHAs to exfoliate dead cells, revealing a brighter, even skin tone.", stock: "in-stock", image: "" },
  { id: "product-bodybutter", category: "body", name: "TVS Whipped Shea Body Butter", price: 10000, desc: "A rich organic hydration body cream whipped with raw shea butter, organic cold-pressed coconut oil, and soothing lavender extracts.", stock: "in-stock", image: "" }
];

// SAFE STORAGE UTILITIES (Preventing sandboxing/SecurityError crashes)
function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("localStorage.getItem failed:", e);
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("localStorage.setItem failed:", e);
  }
}

function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("localStorage.removeItem failed:", e);
  }
}

// STATE MANAGEMENT
let catalogProducts = [];
let cart = [];
let currentCategory = "all";

// ==========================================================================
// SITE THEME TOGGLE (synced with main site)
// ==========================================================================
function initSiteTheme() {
  const toggle = document.getElementById("siteThemeToggle");
  if (!toggle) return;

  const icon = toggle.querySelector("i");
  if (!icon) return;

  // Apply saved preference immediately
  const saved = safeGetItem("site-theme");
  if (saved === "dark") {
    document.body.classList.add("dark-mode");
    icon.className = "fa-solid fa-sun";
  }

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    safeSetItem("site-theme", isDark ? "dark" : "light");
  });
}

// DOM LOADER
document.addEventListener("DOMContentLoaded", () => {
  initSiteTheme();
  initHeaderNavigation();
  initCartListeners();
  initCheckoutForm();
  
  // Seed database then load products asynchronously (Non-blocking)
  (async () => {
    try {
      await seedSkincareIfNeeded();
      await loadBoutiqueCatalog();
    } catch (err) {
      console.error("Error loading products database:", err);
    }
  })();
});

// Navigation menu toggle
function initHeaderNavigation() {
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      menuToggle.classList.toggle("open");
      const bars = menuToggle.querySelectorAll(".bar");
      if (menuToggle.classList.contains("open")) {
        bars[0].style.transform = "rotate(45deg) translate(5px, 5px)";
        bars[1].style.opacity = "0";
        bars[2].style.transform = "rotate(-45deg) translate(5px, -6px)";
      } else {
        bars[0].style.transform = "none";
        bars[1].style.opacity = "1";
        bars[2].style.transform = "none";
      }
    });
  }
}

// ==========================================================================
// BOOTSTRAP / SEED SKINCARE PRODUCTS
// ==========================================================================
async function seedSkincareIfNeeded() {
  try {
    const querySnap = await getDocs(collection(db, "skincare_products"));
    if (querySnap.empty) {
      console.log("Seeding default skincare products to Firestore...");
      const batch = writeBatch(db);
      defaultSkincare.forEach(prod => {
        const docRef = doc(db, "skincare_products", prod.id);
        batch.set(docRef, prod);
      });
      await batch.commit();
      console.log("Skincare products seeded successfully.");
    }
  } catch (err) {
    console.error("Firestore skincare seeding failed. Offline fallback in use.", err);
  }
}

// Load products
async function loadBoutiqueCatalog() {
  try {
    const querySnap = await getDocs(collection(db, "skincare_products"));
    catalogProducts = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (catalogProducts.length === 0) catalogProducts = [...defaultSkincare];
  } catch (err) {
    console.error("Failed to load catalog products, falling back:", err);
    catalogProducts = [...defaultSkincare];
  }
  
  renderCatalogProducts();
}

function renderCatalogProducts() {
  const grid = document.getElementById("productsCatalogGrid");
  const searchVal = document.getElementById("shopSearchInput").value.toLowerCase();
  
  if (!grid) return;
  grid.innerHTML = "";
  
  const filtered = catalogProducts.filter(p => {
    const matchesSearch = 
      (p.name || "").toLowerCase().includes(searchVal) || 
      (p.desc || "").toLowerCase().includes(searchVal);
      
    const matchesCat = currentCategory === "all" || p.category === currentCategory;
    
    return matchesSearch && matchesCat;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="text-center w-full text-muted" style="padding: 40px;">No skincare products match your search or filter choice.</div>`;
    return;
  }
  
  filtered.forEach(product => {
    const isOutOfStock = product.stock === "out-of-stock";
    const btnText = isOutOfStock ? "Out of Stock" : "Add to Order";
    const btnDisabled = isOutOfStock ? "disabled" : "";
    const badgeHTML = isOutOfStock ? `<span class="stock-tag out-of-stock">Out of Stock</span>` : `<span class="stock-tag">In Stock</span>`;
    
    let imgHTML = "";
    if (product.image) {
      imgHTML = `<img src="${product.image}" alt="${product.name}">`;
    } else {
      const placeholderText = (product.name || "Product").slice(0, 3).toUpperCase();
      imgHTML = `
        <div class="product-image-placeholder">
          <i class="fa-solid fa-bottle-droplet"></i>
          <span>${placeholderText}</span>
        </div>
      `;
    }
    
    const card = document.createElement("div");
    card.className = "shop-product-card";
    card.innerHTML = `
      <div class="product-image-wrapper">
        ${imgHTML}
        ${badgeHTML}
      </div>
      <div class="product-details-body">
        <div class="product-info-top">
          <span class="product-category-label">${product.category}</span>
          <h4 class="product-title-text">${product.name}</h4>
        </div>
        <p class="product-description-text">${product.desc}</p>
      </div>
      <div class="product-footer-row">
        <span class="product-price-value">₦${product.price.toLocaleString()}</span>
        <button class="btn btn-sm btn-primary add-to-cart-btn" data-id="${product.id}" ${btnDisabled}>${btnText}</button>
      </div>
    `;
    
    // Bind Add to Cart event
    card.querySelector(".add-to-cart-btn").addEventListener("click", () => {
      addToCart(product);
    });
    
    grid.appendChild(card);
  });
}

// Search and Tab controls
document.getElementById("shopSearchInput").addEventListener("input", renderCatalogProducts);

const tabs = document.querySelectorAll("#categoryTabs .shop-tab");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentCategory = tab.getAttribute("data-category");
    renderCatalogProducts();
  });
});

// ==========================================================================
// SHOPPING CART CONTROLS & DRAWER
// ==========================================================================
function initCartListeners() {
  const cartToggleBtn = document.getElementById("cartToggleBtn");
  
  if (cartToggleBtn) {
    cartToggleBtn.addEventListener("click", () => {
      document.getElementById("cartDrawer").classList.add("active");
      document.getElementById("cartDrawerOverlay").classList.add("active");
    });
  }
  
  window.closeCartDrawer = function() {
    document.getElementById("cartDrawer").classList.remove("active");
    document.getElementById("cartDrawerOverlay").classList.remove("active");
  };
}

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1
    });
  }
  
  updateCartUI();
  
  // Open cart drawer automatically on add
  document.getElementById("cartDrawer").classList.add("active");
  document.getElementById("cartDrawerOverlay").classList.add("active");
}

function updateCartUI() {
  const itemsList = document.getElementById("cartItemsList");
  const countBadge = document.getElementById("cartCountBadge");
  const drawerFooter = document.getElementById("cartDrawerFooter");
  const subtotalText = document.getElementById("cartSubtotalText");
  
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  countBadge.textContent = totalCount;
  
  if (cart.length === 0) {
    itemsList.innerHTML = `
      <div class="empty-cart-msg">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Your cart is empty. Add premium products to begin.</p>
        <button class="btn btn-primary btn-sm" onclick="closeCartDrawer()" style="margin-top: 12px;">Start Shopping</button>
      </div>
    `;
    drawerFooter.style.display = "none";
    return;
  }
  
  drawerFooter.style.display = "block";
  itemsList.innerHTML = "";
  
  let subtotal = 0;
  
  cart.forEach(item => {
    const itemCost = item.price * item.qty;
    subtotal += itemCost;
    
    let imgHTML = "";
    if (item.image) {
      imgHTML = `<img src="${item.image}" alt="${item.name}">`;
    } else {
      imgHTML = `<i class="fa-solid fa-bottle-droplet"></i>`;
    }
    
    const row = document.createElement("div");
    row.className = "cart-item-row";
    row.innerHTML = `
      <div class="cart-item-img">${imgHTML}</div>
      <div class="cart-item-details">
        <h5 class="cart-item-name">${item.name}</h5>
        <span class="cart-item-price">₦${item.price.toLocaleString()}</span>
      </div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" onclick="adjustQty('${item.id}', -1)">-</button>
        <span class="cart-qty-text">${item.qty}</span>
        <button class="cart-qty-btn" onclick="adjustQty('${item.id}', 1)">+</button>
        <button class="cart-item-remove-btn" onclick="removeFromCart('${item.id}')"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `;
    itemsList.appendChild(row);
  });
  
  subtotalText.textContent = `₦${subtotal.toLocaleString()}`;
}

window.adjustQty = function(id, val) {
  const item = cart.find(item => item.id === id);
  if (item) {
    item.qty += val;
    if (item.qty <= 0) {
      removeFromCart(id);
    } else {
      updateCartUI();
    }
  }
};

window.removeFromCart = function(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartUI();
};

// ==========================================================================
// CHECKOUT & PAYSTACK GATEWAY INTEGRATION
// ==========================================================================
function initCheckoutForm() {
  const checkoutBtn = document.getElementById("checkoutBtn");
  const checkoutModal = document.getElementById("checkoutModal");
  const checkoutForm = document.getElementById("checkoutForm");
  
  checkoutBtn.addEventListener("click", () => {
    // Close cart drawer
    closeCartDrawer();
    // Open checkout info modal
    checkoutModal.classList.add("active");
  });
  
  window.closeCheckoutModal = function() {
    checkoutModal.classList.remove("active");
  };
  
  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    triggerPaystackPayment();
  });
}

function triggerPaystackPayment() {
  const nameVal = document.getElementById("customerName").value;
  const emailVal = document.getElementById("customerEmail").value;
  const phoneVal = document.getElementById("customerPhone").value;
  const addressVal = document.getElementById("customerAddress").value;
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  const payBtn = document.getElementById("paystackTriggerBtn");
  payBtn.disabled = true;
  payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Initializing Paystack...`;

  try {
    const handler = PaystackPop.setup({
      key: config.paystackPublicKey,
      email: emailVal,
      amount: cartTotal * 100, // Amount is in kobo (Kobo * 100 = Naira)
      currency: "NGN",
      ref: "TVS-PAY-" + Math.floor((Math.random() * 100000000) + 1), // Unique reference
      metadata: {
        custom_fields: [
          { display_name: "Customer Name", variable_name: "customer_name", value: nameVal },
          { display_name: "Phone Number", variable_name: "phone_number", value: phoneVal },
          { display_name: "Delivery Address", variable_name: "delivery_address", value: addressVal }
        ]
      },
      callback: async function(response) {
        // Payment success callback:
        const orderRecord = {
          reference: response.reference,
          customerName: nameVal,
          customerEmail: emailVal,
          customerPhone: phoneVal,
          deliveryAddress: addressVal,
          items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
          total: cartTotal,
          status: "Paid",
          fulfillment: "Pending",
          timestamp: new Date().toISOString()
        };
        
        // Disable overlay form
        payBtn.disabled = false;
        payBtn.innerHTML = `Pay with Paystack <i class="fa-solid fa-credit-card"></i>`;
        
        // Save order to Firestore
        try {
          await setDoc(doc(db, "orders", response.reference), orderRecord);
          console.log("ORDER RECORDED IN FIRESTORE SUCCESSFULLY:", orderRecord);
        } catch (dbErr) {
          console.error("Firestore Order Save Failed, falling back to LocalStorage:", dbErr);
          // Fallback save locally
          let localOrders = JSON.parse(safeGetItem("tvs_orders") || "[]");
          localOrders.push(orderRecord);
          safeSetItem("tvs_orders", JSON.stringify(localOrders));
        }
        
        // Wipe cart state
        cart = [];
        updateCartUI();
        
        // Show success screen
        closeCheckoutModal();
        showSuccessScreen(response.reference, cartTotal, addressVal);
      },
      onClose: function() {
        payBtn.disabled = false;
        payBtn.innerHTML = `Pay with Paystack <i class="fa-solid fa-credit-card"></i>`;
        alert("Payment window closed. Transaction was not completed.");
      }
    });
    
    handler.openIframe();
  } catch (err) {
    payBtn.disabled = false;
    payBtn.innerHTML = `Pay with Paystack <i class="fa-solid fa-credit-card"></i>`;
    console.error("Paystack Checkout setup crashed:", err);
    alert("Could not load Paystack Checkout. Please confirm public API key settings.");
  }
}

function showSuccessScreen(refCode, totalPaid, address) {
  document.getElementById("successRef").textContent = refCode;
  document.getElementById("successTotal").textContent = `₦${totalPaid.toLocaleString()}`;
  document.getElementById("successAddress").textContent = address;
  
  document.getElementById("successOverlay").classList.add("active");
}

window.restartShopSession = function() {
  document.getElementById("successOverlay").classList.remove("active");
  // Scroll to catalog section top
  window.scrollTo({
    top: document.querySelector(".catalog-section").offsetTop - 80,
    behavior: "smooth"
  });
};
