/* ==========================================================================
   THE VILLA SPA - MAIN INTERACTION CONTROLLER
   ========================================================================== */

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, getDocs, deleteDoc, doc, query, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// All API keys are managed in config.js (see .env for the master reference)
let config;
try {
  const configModule = await import("./config.js?v=2026.07.08.50");
  config = configModule.config;
} catch (e) {
  console.warn("config.js not found, using embedded public keys:", e);
}

// Always guarantee config.firebase is set
if (!config || !config.firebase) {
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

// Initialize Firebase — guard against duplicate-app errors
let app, db;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (fbErr) {
  console.error("[TVS] Firebase init error:", fbErr);
  // Create a minimal stub so the rest of the module doesn't crash
  db = null;
}

// 1. SERVICES DATA (Updated prices effective June 8, 2026)
const servicesDatabase = [
  // MASSAGES
  {
    id: "massage-swedish",
    category: "massages",
    name: "Swedish Massage",
    price: 15000,
    duration: 60,
    desc: "A soothing, full-body treatment using long gliding strokes to ease joint stiffness, relax tense muscles, and boost circulation."
  },
  {
    id: "massage-deeptissue",
    category: "massages",
    name: "Deep Tissue Massage",
    price: 20000,
    duration: 60,
    desc: "Targeted therapy focusing on deeper muscle layers to release chronic tension. Perfect for active lifestyles or heavy fatigue."
  },
  {
    id: "massage-aromatherapy",
    category: "massages",
    name: "Aromatherapy Massage",
    price: 22000,
    duration: 60,
    desc: "Infuses restorative botanical essential oils with gentle massage techniques, balancing your nervous system and clearing mental strain."
  },
  {
    id: "massage-hotstone",
    category: "massages",
    name: "Hot Stone Therapy",
    price: 25000,
    duration: 75,
    desc: "Heated volcanic stones are placed strategically and glided along muscles to deeply melt stress, stiffness, and enhance energy flow."
  },

  // FACIALS & PEELS
  {
    id: "facial-deepcleansing",
    category: "facials",
    name: "Deep Cleansing Facial",
    price: 18000,
    duration: 60,
    desc: "A thorough facial involving deep exfoliation, manual extractions, dynamic serums, and custom masks for refreshed skin clarity."
  },
  {
    id: "facial-glowhydrating",
    category: "facials",
    name: "Glow Hydrating Treatment",
    price: 22000,
    duration: 60,
    desc: "A moisture-rich hydration facial using premium hyaluronic acids and botanical blends to restore plumpness and bright dewiness."
  },
  {
    id: "facial-ledphototherapy",
    category: "facials",
    name: "LED Phototherapy Glow",
    price: 25000,
    duration: 75,
    desc: "Combines therapeutic blue or red light technology with custom serums to fight inflammation, bacteria, and boost collagen reproduction."
  },
  {
    id: "facial-goldskinvestment",
    category: "facials",
    name: "Golden Skinvestment Facial",
    price: 30000,
    duration: 90,
    desc: "The ultimate luxury facial. Incorporates real gold-infused sheets, microcurrent lifting, and intensive vitamin-C skin enrichment."
  },

  // WAXING & TINTING
  {
    id: "wax-underarms",
    category: "waxing",
    name: "Silk Underarm Wax",
    price: 5000,
    duration: 20,
    desc: "Quick, hygienic removal of underarm hair leaving the skin silky smooth for weeks. Perfect for sensitive skin."
  },
  {
    id: "wax-legs",
    category: "waxing",
    name: "Full Leg Polish Wax",
    price: 12000,
    duration: 45,
    desc: "Complete leg waxing using organic honey wax, followed by a soothing tea tree cooling oil to prevent redness."
  },
  {
    id: "wax-brazilian",
    category: "waxing",
    name: "Premium Brazilian Wax",
    price: 15000,
    duration: 30,
    desc: "Expert, fast, and intimate waxing service prioritizing comfort, sanitization, and ultra-smooth results."
  },
  {
    id: "wax-face",
    category: "waxing",
    name: "Complete Face Waxing",
    price: 8000,
    duration: 30,
    desc: "Gently removes peach fuzz and shapes brows, cheeks, chin, and upper lip to create a perfect canvas for makeup and skincare."
  },

  // BODY THERAPY
  {
    id: "body-espressoscrub",
    category: "body",
    name: "Espresso & Sugar Body Scrub",
    price: 25000,
    duration: 45,
    desc: "Exfoliates dead cells using organic coffee grounds and raw brown sugars to reduce cellulite, firm skin, and boost glow."
  },
  {
    id: "body-herbalwrap",
    category: "body",
    name: "Luxury Herbal Wrap & Polish",
    price: 30000,
    duration: 60,
    desc: "Includes mineral-rich clay application, warm cocoon wrapping to sweat toxins, and a deep skin polishing wash."
  },
  {
    id: "body-detoxsteam",
    category: "body",
    name: "Charcoal Detox Steam Session",
    price: 15000,
    duration: 45,
    desc: "Thermal steam room session infusing essential oils, drawing out impurities from pores, and opening up airways."
  },

  // MANICURE & PEDICURE
  {
    id: "nail-gelmani",
    category: "nails",
    name: "Gel Manicure & Care",
    price: 10000,
    duration: 45,
    desc: "Nail shaping, cuticle detailing, hand massage, and long-lasting gel polish cured under a premium UV-LED light."
  },
  {
    id: "nail-tvs-pedi",
    category: "nails",
    name: "TVS Signature Pedicure",
    price: 12000,
    duration: 60,
    desc: "Pure luxury. Feet soaking in organic rose petals, sugar scrub exfoliation, massage, foot filing, mask wrapping, and high-shine polish."
  },
  {
    id: "nail-acrylicset",
    category: "nails",
    name: "Premium Acrylic Sculpting",
    price: 15000,
    duration: 75,
    desc: "Elegant extensions sculpted to perfection with custom lengths, shapes, and nail designs."
  }
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
const defaultCategories = [
  { id: "massages", name: "Luxury Massages" },
  { id: "facials", name: "Facials & Peels" },
  { id: "waxing", name: "Waxing & Tinting" },
  { id: "body", name: "Body Therapy" },
  { id: "nails", name: "Manicures & Pedicures" }
];
let categoriesDatabase = [];
let bookingCart = [];
let selectedCategory = null;
let currentWizardStep = 1;
let selectedDateObj = null;
let selectedTimeSlot = null;
let currentCalendarDate = new Date(2026, 5, 5); // Start at June 2026 based on timeline (June 5, 2026)


// DYNAMIC DATA LOADING FROM FIRESTORE
async function loadDynamicData() {
  if (!db) {
    console.warn("[TVS] Firestore not available — using local fallback data only.");
    return;
  }
  // 1. Fetch Services
  try {
    const srvSnap = await getDocs(collection(db, "services"));
    if (!srvSnap.empty) {
      const newServices = [];
      srvSnap.forEach(doc => {
        newServices.push({ id: doc.id, ...doc.data() });
      });
      servicesDatabase.splice(0, servicesDatabase.length, ...newServices);
      console.log("Services loaded dynamically from Firestore:", servicesDatabase);
    }
  } catch (err) {
    console.error("Failed to load services from Firestore. Using hardcoded fallback:", err);
  }

  // Fetch Categories
  try {
    const catSnap = await getDocs(collection(db, "categories"));
    if (!catSnap.empty) {
      const newCategories = [];
      catSnap.forEach(doc => {
        newCategories.push({ id: doc.id, ...doc.data() });
      });
      categoriesDatabase.splice(0, categoriesDatabase.length, ...newCategories);
      console.log("Categories loaded dynamically from Firestore:", categoriesDatabase);
    }
  } catch (err) {
    console.error("Failed to load categories from Firestore. Using fallback:", err);
  }
  if (categoriesDatabase.length === 0) {
    categoriesDatabase = [...defaultCategories];
  }

  // 2. Fetch Reviews
  try {
    const revSnap = await getDocs(collection(db, "reviews"));
    const fetchedReviews = [];
    revSnap.forEach(doc => {
      const data = doc.data();
      if (data.publish !== false) {
        fetchedReviews.push(data);
      }
    });

    if (fetchedReviews.length > 0) {
      const track = document.getElementById("testimonialCarousel");
      const indicatorsContainer = document.getElementById("carouselIndicators");
      if (track && indicatorsContainer) {
        track.innerHTML = "";
        indicatorsContainer.innerHTML = "";
        
        fetchedReviews.forEach((rev, index) => {
          let starsHTML = "";
          for (let i = 0; i < (rev.rating || 5); i++) {
            starsHTML += '<i class="fas fa-star"></i>';
          }
          
          const initials = rev.guestName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
          
          const card = document.createElement("div");
          card.className = "testimonial-card";
          card.innerHTML = `
            <div class="stars">${starsHTML}</div>
            <p class="testimonial-text">"${rev.text}"</p>
            <div class="reviewer-info">
              <div class="reviewer-avatar">${initials}</div>
              <div>
                <h4 class="reviewer-name">${rev.guestName}</h4>
                <p class="reviewer-status">${rev.status || "Verified Guest"}</p>
              </div>
            </div>
          `;
          track.appendChild(card);
          
          const dot = document.createElement("span");
          dot.className = index === 0 ? "dot active" : "dot";
          dot.setAttribute("data-slide", index);
          indicatorsContainer.appendChild(dot);
        });
      }
    }
  } catch (err) {
    console.error("Failed to load reviews from Firestore. Using hardcoded fallback:", err);
  }

  // 3. Fetch Featured Skincare Products
  let fetchedProducts = [];
  try {
    const prodSnap = await getDocs(collection(db, "skincare_products"));
    prodSnap.forEach(doc => {
      fetchedProducts.push(doc.data());
    });
  } catch (err) {
    console.error("Failed to load skincare products from Firestore, using fallback:", err);
  }

  // Fallback if empty or failed
  let listToRender = fetchedProducts.length > 0 ? fetchedProducts : [
    { id: "product-glowserum", category: "serums", name: "TVS Hydrating Glow Serum", price: 18000, desc: "A potent hyaluronic acid and vitamin C formulation to restore skin moisture, reduce fine lines, and promote a dewy, glowing complexion.", stock: "in-stock" },
    { id: "product-cleanser", category: "cleansers", name: "TVS Charcoal Detox Cleanser", price: 12000, desc: "Formulated with activated charcoal and aloe extract to draw out skin impurities, refine pores, and balance oils without over-stripping.", stock: "in-stock" },
    { id: "product-toner", category: "toners", name: "TVS Melanin-Control Toner", price: 15000, desc: "Balances skin pH, eliminates residues, and uses gentle AHAs to exfoliate dead cells, revealing a brighter, even skin tone.", stock: "in-stock" }
  ];
  
  const teaserGrid = document.getElementById("homepageProductsTeaserGrid");
  if (teaserGrid) {
    teaserGrid.innerHTML = "";
    listToRender.slice(0, 3).forEach(prod => {
      let imgHTML = "";
      if (prod.image) {
        imgHTML = `<img src="${prod.image}" alt="${prod.name || "Skincare Product"}" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else {
        const placeholderText = (prod.name || "TVS").slice(0, 3).toUpperCase();
        imgHTML = `
          <div class="product-image-placeholder" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background-color:#EBE5DF; color:#221C1A; font-family:'Playfair Display'; border-bottom:1px solid #EBE5DF;">
            <i class="fa-solid fa-bottle-droplet" style="font-size:2rem; margin-bottom:8px; color:#C5A880;"></i>
            <span style="font-size:0.9rem; font-weight:bold;">${placeholderText}</span>
          </div>
        `;
      }
      
      const card = document.createElement("div");
      card.className = "shop-product-card";
      card.style.backgroundColor = "var(--color-white)";
      card.style.border = "1px solid var(--color-sand-light)";
      card.style.borderRadius = "var(--border-radius-md)";
      card.style.boxShadow = "var(--shadow-subtle)";
      card.style.overflow = "hidden";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.justifyContent = "space-between";
      card.style.transition = "var(--transition-smooth)";
      
      card.innerHTML = `
        <div class="product-image-wrapper" style="position:relative; height:220px; overflow:hidden;">
          ${imgHTML}
        </div>
        <div class="product-details-body" style="padding:20px; display:flex; flex-direction:column; gap:8px;">
          <div class="product-info-top">
            <span class="product-category-label" style="font-size:0.65rem; text-transform:uppercase; color:var(--color-champagne-dark); font-weight:600; letter-spacing:0.8px;">${prod.category || ""}</span>
            <h4 class="product-title-text" style="font-family:var(--font-serif); font-size:1.1rem; color:var(--color-espresso); font-weight:600;">${prod.name || "Skincare Product"}</h4>
          </div>
          <p class="product-description-text" style="font-size:0.78rem; opacity:0.75; line-height:1.5; height:50px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical;">${prod.desc || ""}</p>
        </div>
        <div class="product-footer-row" style="padding:0 20px 20px 20px; display:flex; justify-content:space-between; align-items:center;">
          <span class="product-price-value" style="font-weight:700;">₦${(prod.price || 0).toLocaleString()}</span>
          <a href="products.html" class="btn btn-xs btn-outline">Buy Now</a>
        </div>
      `;
      teaserGrid.appendChild(card);
    });
  }
}

// ==========================================================================
// SITE-WIDE THEME TOGGLE (Light / Dark)
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

// DOM ELEMENTS
// ROBUST INITIALIZER
function runMainInitialization() {
  // 1. Initialize local UI interactions immediately (Non-blocking)
  initSiteTheme();
  initNavigation();
  initTestimonialCarousel();
  initHighlightsModals();
  initSyllabusDrawer();
  initScrollAnimations();
  
  // 2. Custom interactive animations & effects
  initScrollProgress();
  initHeroTypewriter();
  initParallaxHero();
  initCounterAnimations();
  initCardTilt();
  initFloatingButtons();
  initPromoToast();
  initMagneticButtons();
  initParticles();
  initAmbientMusic();
  initGlobalSnow();

  // Initialize service menu and booking wizard IMMEDIATELY with fallback data
  // so the page is fully interactive and doesn't wait for Firestore (offline-first)
  categoriesDatabase = [...defaultCategories];
  initServicesMenu();
  initBookingWizard();
  checkAdminRoute();

  // 3. Load database-dependent data asynchronously (Non-blocking)
  (async () => {
    try {
      await loadDynamicData();
      // Re-render and activate elements with loaded data
      initServicesMenu();
      initBookingWizard();
      checkAdminRoute();
    } catch (err) {
      console.error("Error loading dynamic data from Firestore:", err);
    }
  })();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runMainInitialization);
} else {
  runMainInitialization();
}


// ==========================================================================
// 2. MOBILE MENU & NAVIGATION HEADER
// ==========================================================================
function initNavigation() {
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");
  const navLinks = document.querySelectorAll(".nav-link");

  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    menuToggle.classList.toggle("open");
    // Animation for hamburger bars
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

  // Smooth Navigation Links Scroll Activation
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      // Close mobile menu
      navMenu.classList.remove("active");
      menuToggle.classList.remove("open");
      const bars = menuToggle.querySelectorAll(".bar");
      bars.forEach(b => b.style.transform = "none");
      bars[1].style.opacity = "1";

      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // Track Scrolling to update active nav link
  window.addEventListener("scroll", () => {
    const sections = document.querySelectorAll("section[id]");
    const scrollPosition = window.scrollY + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        document.querySelectorAll(".nav-link").forEach(l => {
          l.classList.remove("active");
          if (l.getAttribute("href") === `#${sectionId}`) {
            l.classList.add("active");
          }
        });
      }
    });
    
    // Add border shadow when scrolling header
    const header = document.querySelector(".main-header");
    if (window.scrollY > 50) {
      header.style.boxShadow = "var(--shadow-subtle)";
    } else {
      header.style.boxShadow = "none";
    }
  });
}

// Helper scroll function
function scrollToSection(id) {
  const element = document.getElementById(id);
  if (element) {
    const offset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
}

// ==========================================================================
// 3. SERVICES MENU (Tabs rendering)
// ==========================================================================
function initServicesMenu() {
  const tabsContainer = document.querySelector(".services-tabs");
  const gridContainer = document.getElementById("servicesGrid");
  if (!tabsContainer || !gridContainer) return;

  tabsContainer.innerHTML = "";
  categoriesDatabase.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.className = `tab-btn${index === 0 ? " active" : ""}`;
    btn.setAttribute("data-category", cat.id);
    btn.textContent = cat.name;
    
    btn.addEventListener("click", () => {
      document.querySelectorAll(".services-tabs .tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderServices(cat.id, gridContainer);
    });
    
    tabsContainer.appendChild(btn);
  });

  // Initial render (First category or fallback)
  const initialCategory = categoriesDatabase[0]?.id || "massages";
  renderServices(initialCategory, gridContainer);
}

function renderServices(category, container) {
  container.innerHTML = "";
  const filtered = servicesDatabase.filter(s => s.category === category);
  
  filtered.forEach(service => {
    const isAdded = bookingCart.some(item => item.id === service.id);
    const btnText = isAdded ? "Added ✓" : "Add to Booking";
    const btnClass = isAdded ? "btn btn-sm btn-primary select-service-btn" : "btn btn-sm btn-outline select-service-btn";
    
    const card = document.createElement("div");
    card.className = "service-card animate-on-scroll animated";
    card.innerHTML = `
      <div class="service-header">
        <h3 class="service-name">${service.name}</h3>
        <span class="service-price">₦${service.price.toLocaleString()}</span>
      </div>
      <p class="service-detail">${service.desc}</p>
      <div class="service-footer">
        <span class="service-duration"><i class="fa-regular fa-clock"></i> ${service.duration} Mins</span>
        <button class="${btnClass}" data-id="${service.id}">${btnText}</button>
      </div>
    `;
    
    // Bind Event
    const btn = card.querySelector(".select-service-btn");
    btn.addEventListener("click", () => toggleCartItem(service, btn));
    
    container.appendChild(card);
  });
}

function toggleCartItem(service, buttonElement) {
  const index = bookingCart.findIndex(item => item.id === service.id);
  
  if (index === -1) {
    // Add to Cart
    bookingCart.push(service);
    buttonElement.textContent = "Added ✓";
    buttonElement.className = "btn btn-sm btn-primary select-service-btn";
  } else {
    // Remove from Cart
    bookingCart.splice(index, 1);
    buttonElement.textContent = "Add to Booking";
    buttonElement.className = "btn btn-sm btn-outline select-service-btn";
  }
  
  updateBookingSummaryBanner();
  syncCartToWizard();
}

function updateBookingSummaryBanner() {
  const banner = document.getElementById("bookingSummaryBanner");
  const countEl = document.getElementById("selectedCount");
  const totalEl = document.getElementById("selectedTotal");
  
  const total = bookingCart.reduce((sum, item) => sum + item.price, 0);
  
  countEl.textContent = bookingCart.length;
  totalEl.textContent = `₦${total.toLocaleString()}`;
  
  if (bookingCart.length > 0) {
    banner.classList.add("active");
  } else {
    banner.classList.remove("active");
  }
}

// ==========================================================================
// 4. HIGHLIGHTS MODALS (Instagram stories simulation)
// ==========================================================================
function initHighlightsModals() {
  window.openHighlightModal = function(type) {
    const modal = document.getElementById("highlightModal");
    const content = document.getElementById("modalBodyContent");
    
    if (type === 'before-after') {
      content.innerHTML = `
        <h3 class="modal-headline">Skincare Transformations</h3>
        <p class="modal-subline">Real results from our facial and skin therapy guests.</p>
        
        <div class="carousel-container" style="margin-top: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div>
              <h5 style="margin-bottom: 8px; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px;">Facial Acne Therapy</h5>
              <div style="background-color: var(--color-sand); height: 200px; display: flex; align-items: center; justify-content: center; border-radius: var(--border-radius-md); font-family: var(--font-serif); font-weight: bold; border: 1px solid var(--color-sand);">Before & After</div>
            </div>
            <div>
              <h5 style="margin-bottom: 8px; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px;">Melanin Glow Peel</h5>
              <div style="background-color: var(--color-sand); height: 200px; display: flex; align-items: center; justify-content: center; border-radius: var(--border-radius-md); font-family: var(--font-serif); font-weight: bold; border: 1px solid var(--color-sand);">Before & After</div>
            </div>
          </div>
          <p style="font-size: 0.85rem; font-style: italic; opacity: 0.8; text-align: center;">"Skinvestment is consistency. Our therapists tailor home care plans alongside lounge treatments."</p>
        </div>
      `;
    } else if (type === 'experience') {
      content.innerHTML = `
        <h3 class="modal-headline">The Sanctuary Experience</h3>
        <p class="modal-subline">Take a virtual glance into our serene Awka lounge.</p>
        
        <img src="assets/spa_hero_bg.jpeg" class="highlight-modal-graphic" alt="Luxury Spa Massage Room">
        
        <div style="font-size: 0.9rem; line-height: 1.6; opacity: 0.9;">
          <p style="margin-bottom: 12px;"><strong>Private Treatment Chambers:</strong> Each room is soundproofed and features customizable ambient lighting, aromatherapy diffusion, and temperature control to ensure absolute detachment from the outside world.</p>
          <p><strong>Sanitation Promise:</strong> We enforce hospital-grade disinfection policies. Every sheet, towel, instrument, and surface is meticulously sterilized between guest reservations.</p>
        </div>
      `;
    }
    
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  };
  
  window.closeHighlightModal = function() {
    const modal = document.getElementById("highlightModal");
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  };
}

// ==========================================================================
// 5. TESTIMONIAL CAROUSEL
// ==========================================================================
function initTestimonialCarousel() {
  const track = document.getElementById("testimonialCarousel");
  const dots = document.querySelectorAll(".carousel-indicators .dot");
  if (!track || dots.length === 0) return;
  let activeIndex = 0;
  let autoplayInterval;

  function moveToSlide(index) {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(d => d.classList.remove("active"));
    dots[index].classList.add("active");
    activeIndex = index;
  }

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      const index = parseInt(dot.getAttribute("data-slide"));
      moveToSlide(index);
      resetAutoplay();
    });
  });

  function startAutoplay() {
    autoplayInterval = setInterval(() => {
      let next = (activeIndex + 1) % dots.length;
      moveToSlide(next);
    }, 5000);
  }

  function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
  }

  // Swipe support for touch screens
  let touchStartX = 0;
  let touchEndX = 0;
  
  track.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleGesture();
  }, { passive: true });

  function handleGesture() {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) { // threshold 50px
      if (diff > 0) {
        // Swiped left, show next
        let next = (activeIndex + 1) % dots.length;
        moveToSlide(next);
      } else {
        // Swiped right, show prev
        let prev = (activeIndex - 1 + dots.length) % dots.length;
        moveToSlide(prev);
      }
      resetAutoplay();
    }
  }

  startAutoplay();
}

// ==========================================================================
// 6. SYLLABUS & BOOTCAMP MODAL CONTROLS
// ==========================================================================
function initSyllabusDrawer() {
  const viewSyllabusBtn = document.getElementById("viewSyllabusBtn");
  const syllabusModal = document.getElementById("syllabusModal");
  
  viewSyllabusBtn.addEventListener("click", () => {
    syllabusModal.classList.add("active");
    document.body.style.overflow = "hidden";
  });
  
  window.closeSyllabusModal = function() {
    syllabusModal.classList.remove("active");
    document.body.style.overflow = "auto";
  };
  
  // Bootcamp Enroll Modal
  const bootcampModal = document.getElementById("bootcampModal");
  const enrollForm = document.getElementById("bootcampEnrollForm");
  const enrollSuccess = document.getElementById("enrollSuccessMsg");
  
  window.openBootcampEnrollModal = function() {
    bootcampModal.classList.add("active");
    enrollForm.style.display = "block";
    enrollSuccess.style.display = "none";
    document.body.style.overflow = "hidden";
  };
  
  window.closeBootcampModal = function() {
    bootcampModal.classList.remove("remove");
    bootcampModal.classList.remove("active");
    document.body.style.overflow = "auto";
  };
  
  enrollForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("enrollName").value;
    const phone = document.getElementById("enrollPhone").value;
    const plan = document.getElementById("enrollPlan").value;
    
    const enrollData = {
      guestName: name,
      phone: phone,
      plan: plan,
      timestamp: new Date().toISOString()
    };
    
    const submitBtn = enrollForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

    try {
      await addDoc(collection(db, "bootcamp_enrollments"), enrollData);
      console.log("BOOTCAMP ENROLLMENT SAVED TO FIRESTORE:", enrollData);
    } catch (err) {
      console.error("Bootcamp Enrollment Firestore Save Failed:", err);
      // Fallback save in localStorage
      let localEnrollments = JSON.parse(safeGetItem("tvs_bootcamp_enrollments") || "[]");
      localEnrollments.push(enrollData);
      safeSetItem("tvs_bootcamp_enrollments", JSON.stringify(localEnrollments));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
    
    // Simulate booking save or email trigger
    enrollForm.style.display = "none";
    enrollSuccess.style.display = "block";
  });
}

// ==========================================================================
// 7. BOOKING WIZARD LOGIC
// ==========================================================================
function initBookingWizard() {
  // Navigation Buttons
  const step1Next = document.getElementById("step1Next");
  const step2Prev = document.getElementById("step2Prev");
  const step2Next = document.getElementById("step2Next");
  const step3Prev = document.getElementById("step3Prev");
  const step3Next = document.getElementById("step3Next");
  const step4Prev = document.getElementById("step4Prev");
  const bookingForm = document.getElementById("bookingForm");
  
  // Sync category choices
  syncCategoriesToWizard();
  
  step1Next.addEventListener("click", () => {
    if (selectedCategory) {
      changeStep(2);
      syncCartToWizard();
    }
  });
  
  step2Prev.addEventListener("click", () => changeStep(1));
  step2Next.addEventListener("click", () => {
    if (bookingCart.length > 0) {
      changeStep(3);
      renderCalendar();
    }
  });
  
  step3Prev.addEventListener("click", () => changeStep(2));
  step3Next.addEventListener("click", () => {
    if (selectedDateObj && selectedTimeSlot) {
      changeStep(4);
    }
  });
  
  step4Prev.addEventListener("click", () => changeStep(3));
  
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveBooking();
  });
}

function changeStep(stepNumber) {
  // Validate steps if progressing forward
  if (stepNumber === 2 && !selectedCategory) return;
  if (stepNumber === 3 && bookingCart.length === 0) return;
  if (stepNumber === 4 && (!selectedDateObj || !selectedTimeSlot)) return;
  
  currentWizardStep = stepNumber;
  
  // Update UI Panels
  document.querySelectorAll(".wizard-panel").forEach(panel => {
    panel.classList.remove("active");
  });
  const targetPanel = document.getElementById(`step${stepNumber}Panel`);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }
  
  // Update Steps Header Progress
  document.querySelectorAll(".progress-step").forEach(step => {
    const sNum = parseInt(step.getAttribute("data-step"));
    step.classList.remove("active", "completed");
    
    if (sNum === stepNumber) {
      step.classList.add("active");
    } else if (sNum < stepNumber) {
      step.classList.add("completed");
    }
  });
  
  // Scroll to Wizard Header nicely
  scrollToSection("booking-section");
}

// STEP 1 WIZARD: Category synchronization
function syncCategoriesToWizard() {
  const container = document.getElementById("wizardCategoriesList");
  const step1Next = document.getElementById("step1Next");
  if (!container) return;
  container.innerHTML = "";
  
  categoriesDatabase.forEach(cat => {
    const card = document.createElement("div");
    card.className = "category-option-card";
    
    // Toggle active state styling
    if (selectedCategory === cat.id) {
      card.style.borderColor = "var(--color-champagne-dark)";
      card.style.backgroundColor = "rgba(197, 168, 128, 0.08)";
    }
    
    card.innerHTML = `
      <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-champagne-dark);"><i class="fa-solid fa-spa"></i></div>
      <strong style="display: block; font-family: var(--font-serif); font-size: 1.05rem; color: var(--color-espresso);">${cat.name}</strong>
    `;
    
    card.addEventListener("click", () => {
      selectedCategory = cat.id;
      bookingCart = [];
      updateBookingSummaryBanner();
      
      document.querySelectorAll(".category-option-card").forEach(c => {
        c.style.borderColor = "";
        c.style.backgroundColor = "";
      });
      card.style.borderColor = "var(--color-champagne-dark)";
      card.style.backgroundColor = "rgba(197, 168, 128, 0.08)";
      
      step1Next.disabled = false;
    });
    
    container.appendChild(card);
  });
}

// STEP 2 WIZARD: Cart synchronization (Service Choice)
function syncCartToWizard() {
  const wizardServicesList = document.getElementById("wizardServicesList");
  const wizardSelectedList = document.getElementById("wizardSelectedList");
  const step2Next = document.getElementById("step2Next");
  
  if (!wizardServicesList) return;
  wizardServicesList.innerHTML = "";
  
  const cat = categoriesDatabase.find(c => c.id === selectedCategory);
  if (cat) {
    const items = servicesDatabase.filter(s => s.category === cat.id);
    if (items.length > 0) {
      const divider = document.createElement("div");
      divider.className = "category-divider-title";
      divider.style.gridColumn = "1 / -1";
      divider.style.marginTop = "12px";
      divider.style.fontFamily = "var(--font-serif)";
      divider.style.fontSize = "0.95rem";
      divider.style.fontWeight = "bold";
      divider.style.borderBottom = "1.5px solid var(--color-sand)";
      divider.style.paddingBottom = "4px";
      divider.style.color = "var(--color-champagne-dark)";
      divider.textContent = cat.name;
      wizardServicesList.appendChild(divider);
      
      items.forEach(item => {
        const isSelected = bookingCart.some(c => c.id === item.id);
        const itemCard = document.createElement("div");
        itemCard.className = isSelected ? "wiz-service-select-item selected" : "wiz-service-select-item";
        itemCard.innerHTML = `
          <div class="wiz-service-info">
            <span class="wiz-service-name">${item.name}</span>
            <span class="wiz-service-meta">${item.duration} Mins · ₦${item.price.toLocaleString()}</span>
          </div>
          <div class="wiz-checkbox">
            <i class="fa-solid fa-check"></i>
          </div>
        `;
        
        itemCard.addEventListener("click", () => {
          const index = bookingCart.findIndex(c => c.id === item.id);
          if (index === -1) {
            bookingCart.push(item);
          } else {
            bookingCart.splice(index, 1);
          }
          updateBookingSummaryBanner();
          syncCartToWizard();
          
          // Re-render service tab lists to sync checkmarks
          const activeTabBtn = document.querySelector(".tab-btn.active");
          if (activeTabBtn) {
            const gridContainer = document.getElementById("servicesGrid");
            renderServices(activeTabBtn.getAttribute("data-category"), gridContainer);
          }
        });
        
        wizardServicesList.appendChild(itemCard);
      });
    }
  }

  // 2. Render Selected Summary list
  if (bookingCart.length === 0) {
    wizardSelectedList.innerHTML = `<p class="empty-selection-msg">No treatments selected yet. Add services above to begin.</p>`;
    if (step2Next) step2Next.disabled = true;
  } else {
    if (step2Next) step2Next.disabled = false;
    let sum = 0;
    let listHTML = `<div class="selected-items-wrapper">`;
    
    bookingCart.forEach(item => {
      sum += item.price;
      listHTML += `
        <div class="selected-item-row">
          <span>${item.name} (${item.duration}m)</span>
          <div>
            <strong>₦${item.price.toLocaleString()}</strong>
            <button type="button" class="remove-btn" onclick="removeWizardCartItem('${item.id}')"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </div>
      `;
    });
    
    listHTML += `
        <div class="selected-total-row">
          <span>Estimated Subtotal:</span>
          <strong>₦${sum.toLocaleString()}</strong>
        </div>
      </div>
    `;
    
    wizardSelectedList.innerHTML = listHTML;
  }
}

// Global hook to remove items inside the wizard summary block
window.removeWizardCartItem = function(id) {
  const index = bookingCart.findIndex(item => item.id === id);
  if (index !== -1) {
    bookingCart.splice(index, 1);
    updateBookingSummaryBanner();
    syncCartToWizard();
    
    // Sync tab rendering checks
    const activeTabBtn = document.querySelector(".tab-btn.active");
    if (activeTabBtn) {
      const gridContainer = document.getElementById("servicesGrid");
      renderServices(activeTabBtn.getAttribute("data-category"), gridContainer);
    }
  }
};

// STEP 2 WIZARD: Calendar Logic
function renderCalendar() {
  const monthYearEl = document.getElementById("calendarMonthYear");
  const daysGrid = document.getElementById("calendarDaysGrid");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  
  const currentYear = currentCalendarDate.getFullYear();
  const currentMonth = currentCalendarDate.getMonth();
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  monthYearEl.textContent = `${months[currentMonth]} ${currentYear}`;
  
  // Set up days in month
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  daysGrid.innerHTML = "";
  
  // Render empty padding slots for leading weekdays
  for (let i = 0; i < firstDayIndex; i++) {
    const pad = document.createElement("span");
    daysGrid.appendChild(pad);
  }
  
  // Current real-world time reference (June 5, 2026)
  const today = new Date(2026, 5, 5); 
  
  for (let day = 1; day <= totalDays; day++) {
    const dayDate = new Date(currentYear, currentMonth, day);
    const dayBtn = document.createElement("button");
    dayBtn.type = "button";
    dayBtn.className = "calendar-day-btn";
    dayBtn.textContent = day;
    
    // Disable past dates relative to June 5, 2026
    if (dayDate < today) {
      dayBtn.disabled = true;
    }
    
    // Check if current date matches today
    if (dayDate.toDateString() === today.toDateString()) {
      dayBtn.classList.add("today");
    }
    
    // Highlight if selected
    if (selectedDateObj && dayDate.toDateString() === selectedDateObj.toDateString()) {
      dayBtn.classList.add("selected-day");
    }
    
    dayBtn.addEventListener("click", () => {
      selectedDateObj = dayDate;
      selectedTimeSlot = null; // Reset time slot
      document.getElementById("step3Next").disabled = true;
      
      // Update visual calendar classes
      document.querySelectorAll(".calendar-day-btn").forEach(btn => {
        btn.classList.remove("selected-day");
      });
      dayBtn.classList.add("selected-day");
      
      updateSelectedDateDisplay();
      renderTimeSlots(dayDate);
    });
    
    daysGrid.appendChild(dayBtn);
  }
  
  // Calendar month navigation
  prevMonthBtn.onclick = () => {
    // Lock moving before June 2026
    const minMonth = new Date(2026, 5, 1);
    const prevMonthDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1);
    if (prevMonthDate >= minMonth) {
      currentCalendarDate = prevMonthDate;
      renderCalendar();
    }
  };
  
  nextMonthBtn.onclick = () => {
    currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1);
    renderCalendar();
  };
}

function updateSelectedDateDisplay() {
  const display = document.getElementById("selectedDateDisplay");
  if (selectedDateObj) {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    display.textContent = selectedDateObj.toLocaleDateString('en-US', options);
  } else {
    display.textContent = "Select a date";
  }
}

function renderTimeSlots(date) {
  const container = document.getElementById("timeSlotsGrid");
  container.innerHTML = "";
  
  const isSunday = date.getDay() === 0;
  
  // Slots (Sunday: 1pm - 7pm, Mon-Sat: 9am - 7pm)
  let slots = [];
  if (isSunday) {
    slots = ["1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM"];
  } else {
    slots = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM"];
  }
  
  slots.forEach(slot => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "time-slot-btn";
    btn.textContent = slot;
    
    if (selectedTimeSlot === slot) {
      btn.classList.add("selected-slot");
    }
    
    btn.addEventListener("click", () => {
      selectedTimeSlot = slot;
      document.querySelectorAll(".time-slot-btn").forEach(b => {
        b.classList.remove("selected-slot");
      });
      btn.classList.add("selected-slot");
      
      // Enable next step
      document.getElementById("step3Next").disabled = false;
    });
    
    container.appendChild(btn);
  });
}
async function saveBooking() {
  const name = document.getElementById("guestName").value;
  const phone = document.getElementById("guestPhone").value;
  const email = document.getElementById("guestEmail").value;
  const notes = document.getElementById("guestNotes").value;
  const paymentOption = document.querySelector('input[name="paymentOption"]:checked').value;
  const total = bookingCart.reduce((sum, item) => sum + item.price, 0);
  
  const receiptId = "TVS-" + Math.floor(100000 + Math.random() * 900000);
  
  const dateOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const formattedDate = selectedDateObj.toLocaleDateString('en-US', dateOptions);
  
  const bookingRecord = {
    receiptId,
    guestName: name,
    phone,
    email,
    notes,
    date: formattedDate,
    time: selectedTimeSlot,
    services: bookingCart.map(item => ({ name: item.name, price: item.price })),
    total,
    paymentStatus: paymentOption === "pay-now" ? "Paid" : "Pay Later",
    status: paymentOption === "pay-now" ? "Confirmed" : "Pending",
    timestamp: new Date().toISOString()
  };
  
  const submitBtn = document.getElementById("step4Submit");
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  
  const performSave = async (record) => {
    try {
      // Save to Firestore
      await setDoc(doc(db, "bookings", receiptId), record);
      console.log("RESERVATION CONFIRMED & SAVED TO FIRESTORE:", record);
    } catch (err) {
      console.error("Firestore Save Failed, falling back to LocalStorage:", err);
      // Local fallback
      let localDb = JSON.parse(safeGetItem("tvs_bookings") || "[]");
      localDb.push(record);
      safeSetItem("tvs_bookings", JSON.stringify(localDb));
    }
  };

  const completeBookingUI = (record) => {
    // Populate Receipt UI
    document.getElementById("receiptId").textContent = receiptId;
    document.getElementById("receiptGuest").textContent = name;
    document.getElementById("receiptDateTime").textContent = `${formattedDate} @ ${selectedTimeSlot}`;
    document.getElementById("receiptTotal").textContent = `₦${total.toLocaleString()}`;
    
    const paymentStatusEl = document.getElementById("receiptPaymentStatus");
    paymentStatusEl.textContent = record.paymentStatus;
    
    if (record.paymentStatus === "Paid") {
      paymentStatusEl.style.color = "#6E8A75";
      document.getElementById("bookingSuccessTitle").textContent = "Your Luxury Rejuvenation is Fully Paid!";
      document.getElementById("bookingSuccessMessage").textContent = "Thank you for your transaction via Paystack. Your booking has been secured and confirmed!";
    } else {
      paymentStatusEl.style.color = "var(--color-champagne-dark)";
      document.getElementById("bookingSuccessTitle").textContent = "Your Escape is Scheduled!";
      document.getElementById("bookingSuccessMessage").textContent = "Thank you for choosing The Villa Spa. A confirmation receipt has been saved. We look forward to pampering you!";
    }
    
    const receiptServicesUl = document.getElementById("receiptServicesList");
    receiptServicesUl.innerHTML = "";
    bookingCart.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} (₦${item.price.toLocaleString()})`;
      receiptServicesUl.appendChild(li);
    });
    
    // Wipe selection state
    bookingCart = [];
    selectedCategory = null;
    updateBookingSummaryBanner();
    syncCartToWizard();
    
    // Sync page checkbox checks
    const activeTabBtn = document.querySelector(".tab-btn.active");
    if (activeTabBtn) {
      const gridContainer = document.getElementById("servicesGrid");
      renderServices(activeTabBtn.getAttribute("data-category"), gridContainer);
    }
    
    // Move to Success Panel
    changeStep(5);
  };
  
  if (paymentOption === "pay-now") {
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Initializing Paystack...`;
    try {
      const handler = PaystackPop.setup({
        key: config.paystackPublicKey,
        email: email || "info@thevillaspawellness.com",
        amount: total * 100, // Amount in kobo
        currency: "NGN",
        ref: "TVS-BOOK-" + Math.floor((Math.random() * 100000000) + 1),
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", variable_name: "customer_name", value: name },
            { display_name: "Phone Number", variable_name: "phone_number", value: phone },
            { display_name: "Appointment Date", variable_name: "appt_date", value: formattedDate },
            { display_name: "Appointment Time", variable_name: "appt_time", value: selectedTimeSlot }
          ]
        },
        callback: async function(response) {
          const paidRecord = {
            ...bookingRecord,
            paymentStatus: "Paid",
            paystackRef: response.reference,
            status: "Confirmed"
          };
          await performSave(paidRecord);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          completeBookingUI(paidRecord);
        },
        onClose: function() {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          alert("Payment window closed. Transaction was not completed.");
        }
      });
      handler.openIframe();
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      console.error("Paystack Checkout setup crashed:", err);
      alert("Could not load Paystack Checkout. Please select 'Pay Later' or check connection.");
    }
  } else {
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Securing booking...`;
    const unpaidRecord = {
      ...bookingRecord,
      paymentStatus: "Pay Later",
      status: "Pending"
    };
    await performSave(unpaidRecord);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
    completeBookingUI(unpaidRecord);
  }
}

window.restartBookingWizard = function() {
  // Reset wizard states
  selectedCategory = null;
  selectedDateObj = null;
  selectedTimeSlot = null;
  currentCalendarDate = new Date(2026, 5, 5);
  
  // Clear forms
  document.getElementById("bookingForm").reset();
  
  const step1Next = document.getElementById("step1Next");
  if (step1Next) step1Next.disabled = true;
  
  // Go back to step 1
  changeStep(1);
  syncCategoriesToWizard();
};

// ==========================================================================
// 8. ADMIN DASHBOARD DATABASE VIEW
// ==========================================================================
async function checkAdminRoute() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("admin") === "true") {
    document.getElementById("adminDashboard").style.display = "block";
    await refreshAdminDashboard();
    
    // Scroll down to admin dashboard automatically
    setTimeout(() => {
      scrollToSection("adminDashboard");
    }, 500);
  }
}

async function refreshAdminDashboard() {
  const totalBookingsEl = document.getElementById("adminTotalBookings");
  const totalRevenueEl = document.getElementById("adminTotalRevenue");
  const tableBody = document.getElementById("bookingsTableBody");
  
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Fetching records from database...</td>
    </tr>
  `;

  let bookingsList = [];
  try {
    const q = query(collection(db, "bookings"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      bookingsList.push(doc.data());
    });
  } catch (err) {
    console.error("Failed to fetch from Firestore, checking LocalStorage fallback:", err);
    bookingsList = JSON.parse(safeGetItem("tvs_bookings") || "[]");
    bookingsList.reverse();
  }

  totalBookingsEl.textContent = bookingsList.length;
  
  const totalRevenue = bookingsList.reduce((sum, record) => sum + record.total, 0);
  totalRevenueEl.textContent = `₦${totalRevenue.toLocaleString()}`;
  
  tableBody.innerHTML = "";
  if (bookingsList.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No reservations saved yet. Run the booking wizard on the frontend to populate bookings!</td>
      </tr>
    `;
    return;
  }
  
  bookingsList.forEach((record) => {
    const servicesList = record.services.map(s => s.name).join(", ");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${record.receiptId}</strong></td>
      <td>${record.guestName}</td>
      <td><a href="tel:${record.phone}" style="color: var(--color-champagne-light); text-decoration: underline;">${record.phone}</a></td>
      <td>${record.date} @ ${record.time}</td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${servicesList}">${servicesList}</td>
      <td><strong>₦${record.total.toLocaleString()}</strong></td>
      <td><button class="btn btn-xs btn-outline" style="border-color: var(--color-error); color: var(--color-error); background: none;" onclick="deleteReservation('${record.receiptId}')">Delete</button></td>
    `;
    tableBody.appendChild(tr);
  });
}

window.deleteReservation = async function(id) {
  try {
    await deleteDoc(doc(db, "bookings", id));
    console.log(`Document ${id} successfully deleted from Firestore.`);
  } catch (err) {
    console.error("Failed to delete from Firestore, fallback to local:", err);
    let localDb = JSON.parse(safeGetItem("tvs_bookings") || "[]");
    const filtered = localDb.filter(r => r.receiptId !== id);
    safeSetItem("tvs_bookings", JSON.stringify(filtered));
  }
  await refreshAdminDashboard();
};

window.clearAllReservations = async function() {
  if (confirm("Are you sure you want to completely wipe all bookings in Firestore?")) {
    try {
      const q = query(collection(db, "bookings"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log("All Firestore bookings cleared.");
    } catch (err) {
      console.error("Firestore batch clear failed:", err);
    }
    safeRemoveItem("tvs_bookings");
    await refreshAdminDashboard();
  }
};

window.closeAdminPortal = function() {
  document.getElementById("adminDashboard").style.display = "none";
  // Remove '?admin=true' query param without page reload
  const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
  window.history.pushState({path: newurl}, '', newurl);
};

// ==========================================================================
// 9. ANIMATIONS & SCROLL INTERSECTIONS
// ==========================================================================
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll(".animate-on-scroll");

  // Immediately show any element already in the viewport (e.g. on page refresh)
  animatedElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add("animated");
    }
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animated");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.01,   // 1% visibility is enough
      rootMargin: "0px"  // no negative margin that blocks triggering
    });

    // Only observe elements not yet animated
    animatedElements.forEach(el => {
      if (!el.classList.contains("animated")) observer.observe(el);
    });
  } else {
    animatedElements.forEach(el => el.classList.add("animated"));
  }
}

// ==========================================================================
// 10. NEW INTERACTIVE & DYNAMIC EFFECTS
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

function initHeroTypewriter() {
  const target = document.getElementById("heroTypingText");
  if (!target) return;
  const words = ["Restore Your Glow", "Reclaim Your Peace", "Invest In Your Skin"];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 100;

  function type() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      target.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 50;
    } else {
      target.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 120;
    }

    if (!isDeleting && charIndex === currentWord.length) {
      typingSpeed = 2000; // Pause at end of word
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typingSpeed = 500; // Pause before typing next word
    }

    setTimeout(type, typingSpeed);
  }
  type();
}

function initParallaxHero() {
  const heroBg = document.querySelector(".hero-section .hero-bg");
  if (!heroBg) return;
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      heroBg.style.transform = `translateY(${scrollY * 0.4}px)`;
    }
  }, { passive: true });
}

function initCounterAnimations() {
  const counters = document.querySelectorAll(".stat-number");
  if (counters.length === 0) return;

  const easeOutQuad = t => t * (2 - t);
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute("data-target"), 10) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 2000; // 2 seconds
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutQuad(progress);
      const currentValue = Math.floor(easedProgress * target);
      el.textContent = currentValue + suffix;
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    };
    window.requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px" });
    counters.forEach(c => observer.observe(c));
  } else {
    counters.forEach(c => animateCounter(c));
  }
}

function initCardTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) {
    return;
  }
  
  const cards = document.querySelectorAll(".service-card, .shop-product-card");
  cards.forEach(card => {
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

function initPromoToast() {
  const toast = document.getElementById("promoToast");
  const closeBtn = document.getElementById("toastCloseBtn");
  if (!toast || !closeBtn) return;
  
  if (sessionStorage.getItem("tvs_promo_dismissed") !== "true") {
    setTimeout(() => {
      toast.classList.add("show");
    }, 2500);
  }
  
  closeBtn.addEventListener("click", () => {
    toast.classList.remove("show");
    sessionStorage.setItem("tvs_promo_dismissed", "true");
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

function initParticles() {
  const container = document.querySelector(".hero-particles");
  if (!container) return;
  for (let i = 0; i < 12; i++) {
    const orb = document.createElement("div");
    orb.className = "particle-orb";
    const size = Math.random() * 80 + 40;
    orb.style.width = `${size}px`;
    orb.style.height = `${size}px`;
    orb.style.left = `${Math.random() * 100}%`;
    orb.style.top = `${Math.random() * 100}%`;
    orb.style.animationDelay = `${Math.random() * -15}s`;
    orb.style.animationDuration = `${Math.random() * 10 + 15}s`;
    container.appendChild(orb);
  }
}

// ── Ambient Music — delegates to inline YouTube player in index.html ──
// All YouTube player logic lives in the non-module <script> block in index.html
// so it's globally visible to YouTube's iframe_api callback.

function startSpaAudio() {
  if (typeof window.startSpaAudioGlobal === 'function') window.startSpaAudioGlobal();
}

function stopSpaAudio() {
  if (typeof window.stopSpaAudioGlobal === 'function') window.stopSpaAudioGlobal();
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

    const size = Math.random() * 5 + 3;           // 3–8px (slightly bigger)
    flake.style.width = `${size}px`;
    flake.style.height = `${size}px`;
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.top = `-10px`;

    const speed = Math.random() * 6 + 6;          // 6–12s (faster than before)
    flake.style.animationDuration = `${speed}s`;

    const drift = Math.random() * 80 - 40;
    flake.style.setProperty("--drift-x", `${drift}px`);

    container.appendChild(flake);
    setTimeout(() => flake.remove(), speed * 1000);
  }, 140);  // spawn every 140ms (was 200ms)
}
