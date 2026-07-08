/* ==========================================================================
   THE VILLA SPA - SKINCARE BOUTIQUE CONTROLLER
   ========================================================================== */

// Import Firebase SDKs from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, doc, getDocs, setDoc, addDoc, query, orderBy, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// Import configuration settings with fallback for Git deployments
let config;
try {
  const configModule = await import("./config.js?v=2026.07.08.51");
  config = configModule.config;
} catch (e) {
  console.warn("config.js not found, using embedded public keys:", e);
  config = {
    firebase: {
      apiKey: "AIzaSyCrvlvcrHw1vq1zrY_oNPHNAvGQIZkhy7E",
      authDomain: "thevillaspa-14b57.firebaseapp.com",
      projectId: "thevillaspa-14b57",
      storageBucket: "thevillaspa-14b57.firebasestorage.app",
      messagingSenderId: "266753549058",
      appId: "1:266753549058:web:d12b9717c4946957f5581b",
      measurementId: "G-6XN6XK5RB2"
    },
    paystackPublicKey: "pk_test_658c0c1b0162548ad78df88ce61d2d0cb537a7cd"
  };
}

// Firebase configuration matching the workspace config
console.log("[TVS DEBUG] config loaded:", config);
if (!config || !config.firebase) {
  console.warn("[TVS DEBUG] config or config.firebase is missing! Falling back to embedded config...");
  config = {
    firebase: {
      apiKey: "AIzaSyCrvlvcrHw1vq1zrY_oNPHNAvGQIZkhy7E",
      authDomain: "thevillaspa-14b57.firebaseapp.com",
      projectId: "thevillaspa-14b57",
      storageBucket: "thevillaspa-14b57.firebasestorage.app",
      messagingSenderId: "266753549058",
      appId: "1:266753549058:web:d12b9717c4946957f5581b",
      measurementId: "G-6XN6XK5RB2"
    },
    paystackPublicKey: "pk_test_658c0c1b0162548ad78df88ce61d2d0cb537a7cd"
  };
}
const firebaseConfig = config.firebase;

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

// ROBUST INITIALIZER
function runProductsInitialization() {
  initSiteTheme();
  initHeaderNavigation();
  initCartListeners();
  initCheckoutForm();
  
  // Initialize visual premium effects
  initScrollProgress();
  initFloatingButtons();
  initMagneticButtons();
  initAmbientMusic();
  initGlobalSnow();
  
  // Seed database then load products asynchronously (Non-blocking)
  (async () => {
    try {
      await seedSkincareIfNeeded();
      await loadBoutiqueCatalog();
    } catch (err) {
      console.error("Error loading products database:", err);
    }
  })();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runProductsInitialization);
} else {
  runProductsInitialization();
}

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
  
  // Re-initialize card tilt on dynamically rendered cards
  initCardTilt();
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

// ==========================================================================
// PREMIUM VISUAL & AMBIENT EFFECTS (Synced with main site)
// ==========================================================================

function initScrollProgress() {
  const progressBar = document.getElementById("scrollProgressBar");
  if (!progressBar) return;
  window.addEventListener("scroll", () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = scrolled + "%";
  }, { passive: true });
}

function initCardTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) {
    return;
  }
  
  const cards = document.querySelectorAll(".service-card, .shop-product-card");
  cards.forEach(card => {
    // Avoid double binding
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = "true";

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * 8; // Max 8 degrees tilt
      const rotateY = ((centerX - x) / centerX) * 8;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });
}

function initFloatingButtons() {
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (!backToTopBtn) return;
  
  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  }, { passive: true });
  
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

function initMagneticButtons() {
  if (!window.matchMedia("(hover: hover)").matches) return;
  
  const buttons = document.querySelectorAll(".btn-primary, .btn-outline");
  buttons.forEach(btn => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - (rect.width / 2);
      const y = e.clientY - rect.top - (rect.height / 2);
      
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translate(0px, 0px)";
    });
  });
}

function initAmbientMusic() {
  const musicBtn = document.getElementById('musicToggleBtn');
  if (!musicBtn) return;
  musicBtn.addEventListener('click', () => {
    if (typeof window.toggleSpaMusic === 'function') {
      window.toggleSpaMusic();
    }
  });
}

// ── Web Audio Synthesizer Fallback (fires if YouTube embedding is blocked) ──
(function() {
  let ctx = null, masterGain = null, allOscs = [], synthPlaying = false, loopTimer = null;

  const notes = {
    D3:146.83,F3:174.61,A3:220.00,C3:130.81,E3:164.81,G3:196.00,
    Bb2:116.54,F2:87.31,A2:110.00,D4:293.66,F4:349.23,E4:329.63,
    C4:261.63,G4:392.00,A4:440.00
  };

  function horn(freq, t, dur, out, vel=0.45) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(vel, t+0.18);
    g.gain.setValueAtTime(vel, t+dur-0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    g.connect(out);
    ['triangle','sawtooth','sine'].forEach((type,i) => {
      const o = ctx.createOscillator();
      o.type = type; o.frequency.value = freq * (i===2?2:1);
      const og = ctx.createGain(); og.gain.value = i===0?1:i===1?0.12:0.18;
      o.connect(og); og.connect(g); o.start(t); o.stop(t+dur+0.1);
      allOscs.push(o);
    });
  }

  function strings(freq, t, dur, out, vel=0.22) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(vel, t+0.3);
    g.gain.linearRampToValueAtTime(0, t+dur);
    g.connect(out);
    [-4,0,4].forEach(det => {
      const o = ctx.createOscillator(); o.type='sawtooth';
      o.frequency.value=freq; o.detune.value=det;
      o.connect(g); o.start(t); o.stop(t+dur+0.1); allOscs.push(o);
    });
  }

  function scheduleLoop() {
    if (!synthPlaying) return;
    const delay = ctx.createDelay(2); delay.delayTime.value=0.45;
    const fb = ctx.createGain(); fb.gain.value=0.25;
    delay.connect(fb); fb.connect(delay);
    const rev = ctx.createGain(); rev.gain.value=0.4;
    delay.connect(rev); rev.connect(masterGain);
    const sOut = ctx.createGain(); sOut.gain.value=0.36;
    sOut.connect(delay); sOut.connect(masterGain);
    const hOut = ctx.createGain(); hOut.gain.value=0.44;
    const lpf = ctx.createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value=900;
    hOut.connect(lpf); lpf.connect(delay); lpf.connect(masterGain);
    const now = ctx.currentTime+0.2;
    const chords=[[notes.D3,notes.F3,notes.A3],[notes.C3,notes.E3,notes.G3],[notes.C3,notes.E3,notes.G3],[notes.D3,notes.F3,notes.A3],[notes.Bb2,notes.D3,notes.F3],[notes.F2,notes.A2,notes.C3],[notes.C3,notes.E3,notes.G3],[notes.D3,notes.F3,notes.A3]];
    const melody=[[[notes.D4,2],[notes.F4,2]],[[notes.E4,4]],[[notes.C4,2],[notes.E4,2]],[[notes.D4,4]],[[notes.F4,2],[notes.A4,2]],[[notes.G4,4]],[[notes.E4,2],[notes.G4,2]],[[notes.F4,4]]];
    for(let b=0;b<8;b++){
      const bs=now+b*4;
      chords[b].forEach(f=>strings(f,bs,3.9,sOut));
      let off=0; melody[b].forEach(([f,d])=>{horn(f,bs+off,d-0.1,hOut); off+=d;});
    }
    loopTimer=setTimeout(scheduleLoop, 31850);
  }

  function startSynth() {
    if (synthPlaying) return;
    ctx = new (window.AudioContext||window.webkitAudioContext)();
    if (ctx.state==='suspended') ctx.resume();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime+2);
    masterGain.connect(ctx.destination);
    allOscs=[]; synthPlaying=true;
    scheduleLoop();
  }

  function stopSynth() {
    synthPlaying=false;
    if (loopTimer) clearTimeout(loopTimer);
    if (masterGain) { masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime+1.5); }
    setTimeout(()=>{ allOscs.forEach(o=>{try{o.stop();o.disconnect();}catch(e){}}); allOscs=[]; },2000);
  }

  // Exposed as fallback when YouTube embedding is blocked
  window._honorHimSynthFallback = function() {
    console.log('[HonorHim] Synthesizer fallback activated');
    // Re-wire toggle to synth
    window.toggleSpaMusic = function() {
      const btn = document.getElementById('musicToggleBtn');
      if (!synthPlaying) {
        startSynth();
        if (btn) { btn.classList.add('playing'); btn.innerHTML='<i class="fa-solid fa-pause"></i>'; }
      } else {
        stopSynth();
        if (btn) { btn.classList.remove('playing'); btn.innerHTML='<i class="fa-solid fa-play" style="margin-left:2px;"></i>'; }
      }
    };
    window.startSpaAudioGlobal = startSynth;
    window.stopSpaAudioGlobal  = stopSynth;
  };
})();

// ── Global Ambient Snow Effect ──
function initGlobalSnow() {
  const container = document.getElementById("globalSnowContainer");
  if (!container) return;

  setInterval(() => {
    if (document.hidden) return;

    const flake = document.createElement("div");
    flake.className = "snow-flake";

    const size = Math.random() * 4 + 2;           // 2–6px (smaller and more elegant)
    flake.style.width = `${size}px`;
    flake.style.height = `${size}px`;
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.top = `-10px`;

    const speed = Math.random() * 8 + 12;         // 12–20s (slower fall)
    flake.style.animationDuration = `${speed}s`;

    const drift = Math.random() * 60 - 30;        // gentler sway
    flake.style.setProperty("--drift-x", `${drift}px`);

    container.appendChild(flake);
    setTimeout(() => flake.remove(), speed * 1000);
  }, 350);  // spawn every 350ms (fewer particles)
}

