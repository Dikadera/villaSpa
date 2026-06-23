/* ==========================================================================
   THE VILLA SPA - ADMINISTRATIVE CORE CONTROLLER
   ========================================================================== */

// Import Firebase SDKs from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Config Matching User Setup
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

// Data structures for Seeding (if database is empty)
const defaultServices = [
  { id: "massage-swedish", category: "massages", name: "Swedish Massage", price: 15000, duration: 60, desc: "A soothing, full-body treatment using long gliding strokes to ease joint stiffness, relax tense muscles, and boost circulation." },
  { id: "massage-deeptissue", category: "massages", name: "Deep Tissue Massage", price: 20000, duration: 60, desc: "Targeted therapy focusing on deeper muscle layers to release chronic tension. Perfect for active lifestyles or heavy fatigue." },
  { id: "massage-aromatherapy", category: "massages", name: "Aromatherapy Massage", price: 22000, duration: 60, desc: "Infuses restorative botanical essential oils with gentle massage techniques, balancing your nervous system and clearing mental strain." },
  { id: "massage-hotstone", category: "massages", name: "Hot Stone Therapy", price: 25000, duration: 75, desc: "Heated volcanic stones are placed strategically and glided along muscles to deeply melt stress, stiffness, and enhance energy flow." },
  { id: "facial-deepcleansing", category: "facials", name: "Deep Cleansing Facial", price: 18000, duration: 60, desc: "A thorough facial involving deep exfoliation, manual extractions, dynamic serums, and custom masks for refreshed skin clarity." },
  { id: "facial-glowhydrating", category: "facials", name: "Glow Hydrating Treatment", price: 22000, duration: 60, desc: "A moisture-rich hydration facial using premium hyaluronic acids and botanical blends to restore plumpness and bright dewiness." },
  { id: "facial-ledphototherapy", category: "facials", name: "LED Phototherapy Glow", price: 25000, duration: 75, desc: "Combines therapeutic blue or red light technology with custom serums to fight inflammation, bacteria, and boost collagen reproduction." },
  { id: "facial-goldskinvestment", category: "facials", name: "Golden Skinvestment Facial", price: 30000, duration: 90, desc: "The ultimate luxury facial. Incorporates real gold-infused sheets, microcurrent lifting, and intensive vitamin-C skin enrichment." },
  { id: "wax-underarms", category: "waxing", name: "Silk Underarm Wax", price: 5000, duration: 20, desc: "Quick, hygienic removal of underarm hair leaving the skin silky smooth for weeks. Perfect for sensitive skin." },
  { id: "wax-legs", category: "waxing", name: "Full Leg Polish Wax", price: 12000, duration: 45, desc: "Complete leg waxing using organic honey wax, followed by a soothing tea tree cooling oil to prevent redness." },
  { id: "wax-brazilian", category: "waxing", name: "Premium Brazilian Wax", price: 15000, duration: 30, desc: "Expert, fast, and intimate waxing service prioritizing comfort, sanitization, and ultra-smooth results." },
  { id: "wax-face", category: "waxing", name: "Complete Face Waxing", price: 8000, duration: 30, desc: "Gently removes peach fuzz and shapes brows, cheeks, chin, and upper lip to create a perfect canvas for makeup and skincare." },
  { id: "body-espressoscrub", category: "body", name: "Espresso & Sugar Body Scrub", price: 25000, duration: 45, desc: "Exfoliates dead cells using organic coffee grounds and raw brown sugars to reduce cellulite, firm skin, and boost glow." },
  { id: "body-herbalwrap", category: "body", name: "Luxury Herbal Wrap & Polish", price: 30000, duration: 60, desc: "Includes mineral-rich clay application, warm cocoon wrapping to sweat toxins, and a deep skin polishing wash." },
  { id: "body-detoxsteam", category: "body", name: "Charcoal Detox Steam Session", price: 15000, duration: 45, desc: "Thermal steam room session infusing essential oils, drawing out impurities from pores, and opening up airways." },
  { id: "nail-gelmani", category: "nails", name: "Gel Manicure & Care", price: 10000, duration: 45, desc: "Nail shaping, cuticle detailing, hand massage, and long-lasting gel polish cured under a premium UV-LED light." },
  { id: "nail-tvs-pedi", category: "nails", name: "TVS Signature Pedicure", price: 12000, duration: 60, desc: "Pure luxury. Feet soaking in organic rose petals, sugar scrub exfoliation, massage, foot filing, mask wrapping, and high-shine polish." },
  { id: "nail-acrylicset", category: "nails", name: "Premium Acrylic Sculpting", price: 15000, duration: 75, desc: "Elegant extensions sculpted to perfection with custom lengths, shapes, and nail designs." }
];

const defaultReviews = [
  { guestName: "Ugochi O.", rating: 5, text: "Best facial in Awka! The estheticians are extremely professional and knowledgeable. My skin is literally glowing. A perfect skincare investment.", status: "Verified Guest", publish: true, timestamp: new Date(2026, 5, 1).toISOString() },
  { guestName: "Emeka A.", rating: 5, text: "The Deep Tissue massage was exactly what I needed after a stressful week. The environment is extremely clean, soothing, and smells amazing.", status: "Regular Client", publish: true, timestamp: new Date(2026, 5, 2).toISOString() },
  { guestName: "Chioma O.", rating: 5, text: "I registered for the 4-week spa bootcamp. The hands-on training was thorough. I got my certificate, started my home spa, and I'm loving it!", status: "Bootcamp Graduate", publish: true, timestamp: new Date(2026, 5, 3).toISOString() }
];

const defaultSkincare = [
  { id: "product-glowserum", category: "serums", name: "TVS Hydrating Glow Serum", price: 18000, desc: "A potent hyaluronic acid and vitamin C formulation to restore skin moisture, reduce fine lines, and promote a dewy, glowing complexion.", stock: "in-stock", image: "" },
  { id: "product-cleanser", category: "cleansers", name: "TVS Charcoal Detox Cleanser", price: 12000, desc: "Formulated with activated charcoal and aloe extract to draw out skin impurities, refine pores, and balance oils without over-stripping.", stock: "in-stock", image: "" },
  { id: "product-toner", category: "toners", name: "TVS Melanin-Control Toner", price: 15000, desc: "Balances skin pH, eliminates residues, and uses gentle AHAs to exfoliate dead cells, revealing a brighter, even skin tone.", stock: "in-stock", image: "" },
  { id: "product-bodybutter", category: "body", name: "TVS Whipped Shea Body Butter", price: 10000, desc: "A rich organic hydration body cream whipped with raw shea butter, organic cold-pressed coconut oil, and lavender extracts.", stock: "in-stock", image: "" }
];

// STATE MANAGEMENT
let bookings = [];
let bootcampEnrollments = [];
let services = [];
let reviews = [];
let customers = [];
let customerNotes = {}; // key: phone, value: note
let skincareProducts = [];
let orders = [];

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

function safeGetSessionItem(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    console.warn("sessionStorage.getItem failed:", e);
    return null;
  }
}

function safeSetSessionItem(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    console.warn("sessionStorage.setItem failed:", e);
  }
}

// CHARTS OBJECTS
let revenueChart = null;
let categoryChart = null;

// DOM LOADER
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initSidebarMobile();
  initTabNavigation();
  
  const loginOverlay = document.getElementById("adminLoginOverlay");
  const loginForm = document.getElementById("adminLoginForm");
  const passwordInput = document.getElementById("adminPasswordInput");
  const errorMsg = document.getElementById("loginErrorMsg");

  // Check authentication status
  if (safeGetSessionItem("tvs_admin_authenticated") === "true") {
    if (loginOverlay) loginOverlay.classList.add("hidden");
    await initializeDashboard();
  } else {
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const enteredPassword = passwordInput.value;
        
        // Gated access key matching system timelines (villaspa2026)
        if (enteredPassword === "villaspa2026") {
          safeSetSessionItem("tvs_admin_authenticated", "true");
          if (errorMsg) errorMsg.style.display = "none";
          if (loginOverlay) loginOverlay.classList.add("hidden");
          await initializeDashboard();
        } else {
          if (errorMsg) errorMsg.style.display = "block";
          passwordInput.value = "";
          passwordInput.focus();
        }
      });
    }
  }
});

async function initializeDashboard() {
  // Seed Database then load
  await seedDatabaseIfNeeded();
  await loadAllData();

  // Wire up all forms, filters, and modals (safe — DOM is guaranteed ready here)
  initForms();
  initAppointmentFilters();
  initBootcampFilters();
  initServiceModal();
  initCustomerModal();
  initReviewModal();
  initSkincareModal();
  initOrderFilters();
  initExporters();
  initWipeDatabase();
}

// ==========================================================================
// THEME & INTERFACE CONTROLS
// ==========================================================================
function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;
  const themeIcon = themeToggle.querySelector("i");
  if (!themeIcon) return;
  
  // Check localstorage
  if (safeGetItem("admin-theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.className = "fa-solid fa-sun";
  }
  
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
      themeIcon.className = "fa-solid fa-sun";
      safeSetItem("admin-theme", "dark");
    } else {
      themeIcon.className = "fa-solid fa-moon";
      safeSetItem("admin-theme", "light");
    }
    // Re-draw charts with adjusted theme styling if necessary
    renderAnalyticsCharts();
  });
}

function initSidebarMobile() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("adminSidebar");
  
  sidebarToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("active");
  });
  
  document.addEventListener("click", (e) => {
    if (sidebar.classList.contains("active") && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
      sidebar.classList.remove("active");
    }
  });
}

function initTabNavigation() {
  const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
  const pageHeaderTitle = document.getElementById("pageHeaderTitle");
  
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      
      const tab = item.getAttribute("data-tab");
      switchTab(tab);
      
      // Update Header title
      pageHeaderTitle.textContent = item.querySelector("span").textContent;
      
      // Close sidebar on mobile
      document.getElementById("adminSidebar").classList.remove("active");
    });
  });
}

window.switchTab = function(tabName) {
  // Hide all panels
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.remove("active");
  });
  
  // Show target panel
  const targetPanel = document.getElementById(`${tabName}-panel`);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }
  
  // Make sidebar item active
  const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
  navItems.forEach(n => {
    if (n.getAttribute("data-tab") === tabName) {
      n.classList.add("active");
      document.getElementById("pageHeaderTitle").textContent = n.querySelector("span").textContent;
    } else {
      n.classList.remove("active");
    }
  });
};

// ==========================================================================
// DATABASE SEEDER (Check & Populate empty database)
// ==========================================================================
async function seedDatabaseIfNeeded() {
  try {
    // 1. Check services
    const servicesSnap = await getDocs(collection(db, "services"));
    if (servicesSnap.empty) {
      console.log("Seeding services to Firestore...");
      const batch = writeBatch(db);
      defaultServices.forEach(srv => {
        const docRef = doc(db, "services", srv.id);
        batch.set(docRef, srv);
      });
      await batch.commit();
      console.log("Services seeded successfully.");
    }
    
    // 2. Check reviews
    const reviewsSnap = await getDocs(collection(db, "reviews"));
    if (reviewsSnap.empty) {
      console.log("Seeding reviews to Firestore...");
      for (const rev of defaultReviews) {
        await addDoc(collection(db, "reviews"), rev);
      }
      console.log("Reviews seeded successfully.");
    }

    // 3. Check skincare products
    const skincareSnap = await getDocs(collection(db, "skincare_products"));
    if (skincareSnap.empty) {
      console.log("Seeding skincare products to Firestore...");
      const batch = writeBatch(db);
      defaultSkincare.forEach(prod => {
        const docRef = doc(db, "skincare_products", prod.id);
        batch.set(docRef, prod);
      });
      await batch.commit();
      console.log("Skincare products seeded successfully.");
    }
  } catch (err) {
    console.error("Database seeding failed. Using offline fallbacks:", err);
  }
}

// ==========================================================================
// FIREBASE DATA RETRIEVAL & MAPPING
// ==========================================================================
async function loadAllData() {
  try {
    // 1. Fetch Services
    const srvSnap = await getDocs(collection(db, "services"));
    services = srvSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (services.length === 0) services = [...defaultServices];
    
    // 2. Fetch Reviews
    const revSnap = await getDocs(collection(db, "reviews"));
    reviews = revSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (reviews.length === 0) reviews = [...defaultReviews];
    
    // 3. Fetch Bookings (Appointments)
    try {
      const q = query(collection(db, "bookings"), orderBy("timestamp", "desc"));
      const bookSnap = await getDocs(q);
      bookings = bookSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn("Could not load sorted bookings from Firebase (missing index?). Fetching unsorted:");
      const bookSnap = await getDocs(collection(db, "bookings"));
      bookings = bookSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      bookings.sort((a,b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    }
    
    // 4. Fetch Bootcamp Enrollments
    try {
      const q = query(collection(db, "bootcamp_enrollments"), orderBy("timestamp", "desc"));
      const bootSnap = await getDocs(q);
      bootcampEnrollments = bootSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      const bootSnap = await getDocs(collection(db, "bootcamp_enrollments"));
      bootcampEnrollments = bootSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      bootcampEnrollments.sort((a,b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    }
    // 5. Fetch Customer Notes (from custom customers collection)
    const custSnap = await getDocs(collection(db, "customers"));
    customerNotes = {};
    custSnap.docs.forEach(doc => {
      customerNotes[doc.id] = doc.data().notes || "";
    });

    // 6. Fetch Skincare Products Catalog
    const skincareQuerySnap = await getDocs(collection(db, "skincare_products"));
    skincareProducts = skincareQuerySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (skincareProducts.length === 0) skincareProducts = [...defaultSkincare];

    // 7. Fetch Sales Orders (Paystack transactions)
    try {
      const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
      const orderSnap = await getDocs(q);
      orders = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn("Could not load sorted orders, fetching unsorted:");
      const orderSnap = await getDocs(collection(db, "orders"));
      orders = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      orders.sort((a,b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    }

  } catch (err) {
    console.error("Firestore Loading failed. Using LocalStorage client fallback:", err);
    // Fallback loading from localStorage
    bookings = JSON.parse(safeGetItem("tvs_bookings") || "[]");
    bookings.sort((a,b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    bootcampEnrollments = JSON.parse(safeGetItem("tvs_bootcamp_enrollments") || "[]");
    bootcampEnrollments.sort((a,b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    orders = JSON.parse(safeGetItem("tvs_orders") || "[]");
    orders.sort((a,b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    services = [...defaultServices];
    reviews = [...defaultReviews];
    skincareProducts = [...defaultSkincare];
  }

  // Process customer lists from bookings and enrollments
  processCustomersLog();

  // Render everything
  renderDashboardOverview();
  renderAppointmentsTable();
  renderBootcampTable();
  renderServicesGrid();
  renderReviewsTable();
  renderCustomersTable();
  renderSkincareTable();
  renderOrdersTable();
}

// Extract unique customers based on WhatsApp/Phone
function processCustomersLog() {
  const customerMap = new Map();
  
  // Aggregate from appointments
  bookings.forEach(booking => {
    const phone = (booking.phone || "").trim();
    if (!phone) return;
    
    if (!customerMap.has(phone)) {
      customerMap.set(phone, {
        name: booking.guestName,
        phone: phone,
        email: booking.email || "N/A",
        visits: 0,
        spent: 0,
        notes: customerNotes[phone] || ""
      });
    }
    
    const cust = customerMap.get(phone);
    cust.visits += 1;
    cust.spent += (booking.total || 0);
    // Prefer name if it was empty
    if (!cust.name && booking.guestName) cust.name = booking.guestName;
    if (cust.email === "N/A" && booking.email) cust.email = booking.email;
  });
  
  // Aggregate from bootcamp
  bootcampEnrollments.forEach(enroll => {
    const phone = (enroll.phone || "").trim();
    if (!phone) return;
    
    if (!customerMap.has(phone)) {
      customerMap.set(phone, {
        name: enroll.guestName,
        phone: phone,
        email: "N/A",
        visits: 0,
        spent: 0,
        notes: customerNotes[phone] || ""
      });
    }
    
    const cust = customerMap.get(phone);
    // Students spend (Regular: 300k, Premium: 350k)
    const cost = enroll.plan === "premium" ? 350000 : 300000;
    cust.spent += cost;
    cust.visits += 1; // Count bootcamp as a visit/engagement
    if (!cust.name && enroll.guestName) cust.name = enroll.guestName;
  });
  
  customers = Array.from(customerMap.values());
  // Sort customers by spent values
  customers.sort((a, b) => b.spent - a.spent);
}

// ==========================================================================
// 1. RENDER OVERVIEW PANEL & CHARTS
// ==========================================================================
function renderDashboardOverview() {
  // Statistics cards calculation (Bookings + Product Sales)
  const bookingRevenue = bookings.reduce((sum, b) => sum + (b.total || 0), 0);
  const salesRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRevenue = bookingRevenue + salesRevenue;
  
  const pendingBookings = bookings.filter(b => b.status === "Pending" || !b.status).length;
  const premiumBootcamp = bootcampEnrollments.filter(e => e.plan === "premium").length;
  
  const activeReviews = reviews.filter(r => r.publish).length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1) 
    : "5.0";
    
  // Assign text values
  document.getElementById("overviewRevenue").textContent = `₦${totalRevenue.toLocaleString()}`;
  
  // Update breakdown label
  const revenueStatCard = document.querySelector(".stat-card");
  if (revenueStatCard) {
    const changeSpan = revenueStatCard.querySelector(".stat-change");
    if (changeSpan) {
      changeSpan.innerHTML = `<i class="fa-solid fa-circle-info"></i> ₦${bookingRevenue.toLocaleString()} spa · ₦${salesRevenue.toLocaleString()} boutique`;
    }
  }

  document.getElementById("overviewBookings").textContent = bookings.length;
  document.getElementById("overviewPendingBookings").textContent = `${pendingBookings} Pending Confirm`;
  document.getElementById("overviewBootcamp").textContent = bootcampEnrollments.length;
  document.getElementById("overviewPremiumBootcamp").textContent = `${premiumBootcamp} Premium Packages`;
  document.getElementById("overviewRating").textContent = `${avgRating} ★`;
  document.getElementById("overviewActiveReviews").textContent = `${activeReviews} Approved Reviews`;
  
  // Render recent activities table
  const recentTableBody = document.getElementById("recentBookingsTableBody");
  recentTableBody.innerHTML = "";
  
  const recent = bookings.slice(0, 5);
  if (recent.length === 0) {
    recentTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No appointments booked yet.</td></tr>`;
  } else {
    recent.forEach(b => {
      const servicesStr = (b.services || []).map(s => s.name).join(", ");
      const statusClass = (b.status || "Pending").toLowerCase();
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${b.receiptId || "N/A"}</strong></td>
        <td>${b.guestName}</td>
        <td>${b.date} @ ${b.time}</td>
        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${servicesStr}">${servicesStr}</td>
        <td><strong>₦${(b.total || 0).toLocaleString()}</strong></td>
        <td><span class="status-badge ${statusClass}">${b.status || "Pending"}</span></td>
      `;
      recentTableBody.appendChild(tr);
    });
  }

  // Draw charts
  renderAnalyticsCharts();
}

function renderAnalyticsCharts() {
  // Guard: if Chart.js CDN failed to load, skip chart rendering gracefully
  if (typeof Chart === "undefined") {
    console.warn("Chart.js not available (CDN may be offline). Charts skipped.");
    return;
  }

  try {
  const isDark = document.body.classList.contains("dark-mode");
  const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(34, 28, 26, 0.05)";
  const textColor = isDark ? "#D5BD9C" : "#5A524F";
  
  // Wipe existing chart nodes to prevent glitch hover triggers
  if (revenueChart) { revenueChart.destroy(); revenueChart = null; }
  if (categoryChart) { categoryChart.destroy(); categoryChart = null; }
  
  // 1. Chart 1: Revenue earnings trend by date
  const revCtx = document.getElementById("revenueTrendChart").getContext("2d");
  
  // Compile revenue by date
  const revenueByDate = {};
  // Create sorted list of bookings chronological
  const chronoBookings = [...bookings].reverse();
  chronoBookings.forEach(b => {
    const d = b.date ? b.date.split(",")[1]?.trim() || b.date : "Seeded / Mock";
    revenueByDate[d] = (revenueByDate[d] || 0) + (b.total || 0);
  });
  
  const labels = Object.keys(revenueByDate);
  const values = Object.values(revenueByDate);
  
  // Fallback if empty labels
  if (labels.length === 0) {
    labels.push("No Data");
    values.push(0);
  }
  
  revenueChart = new Chart(revCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue (₦)',
        data: values,
        borderColor: '#C5A880',
        backgroundColor: 'rgba(197, 168, 128, 0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
        }
      }
    }
  });
  
  // 2. Chart 2: Category distribution pie chart
  const catCtx = document.getElementById("categoryDistributionChart").getContext("2d");
  
  // Calculate distribution of category choices in appointments
  const catCounts = { massages: 0, facials: 0, waxing: 0, body: 0, nails: 0 };
  bookings.forEach(b => {
    (b.services || []).forEach(srv => {
      // Find the service category in database
      const dbSrv = services.find(s => s.name === srv.name);
      if (dbSrv && dbSrv.category) {
        catCounts[dbSrv.category] = (catCounts[dbSrv.category] || 0) + 1;
      } else {
        // Fallback checks
        catCounts.massages += 1;
      }
    });
  });

  const catLabels = ["Massages", "Facials & Peels", "Waxing & Tinting", "Body Therapy", "Nails Care"];
  const catValues = [catCounts.massages, catCounts.facials, catCounts.waxing, catCounts.body, catCounts.nails];
  
  categoryChart = new Chart(catCtx, {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{
        data: catValues,
        backgroundColor: [
          '#C5A880', // Gold
          '#6E8A75', // Success Green
          '#C29668', // Sand
          '#B56B6B', // Error Red
          '#2E2725'  // Charcoal
        ],
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#221C1A' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
        }
      }
    }
  });
  } catch (chartErr) {
    console.error("Chart rendering error:", chartErr);
  }
}

// ==========================================================================
// 2. RENDER APPOINTMENTS TABLE & EDIT STATUS
// ==========================================================================
function renderAppointmentsTable() {
  const tableBody = document.getElementById("adminBookingsTableBody");
  const searchInput = document.getElementById("appointmentSearch").value.toLowerCase();
  const filterStatus = document.getElementById("appointmentFilterStatus").value;
  
  tableBody.innerHTML = "";
  
  // Filter bookings
  const filtered = bookings.filter(b => {
    const matchesSearch = 
      (b.receiptId || "").toLowerCase().includes(searchInput) ||
      (b.guestName || "").toLowerCase().includes(searchInput) ||
      (b.phone || "").toLowerCase().includes(searchInput);
      
    const status = b.status || "Pending";
    const matchesStatus = filterStatus === "all" || status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No appointments match your search/filter parameters.</td></tr>`;
    return;
  }
  
  filtered.forEach(b => {
    const servicesStr = (b.services || []).map(s => s.name).join(", ");
    const currentStatus = b.status || "Pending";
    
    // Create WhatsApp link template
    const waText = encodeURIComponent(
      `Hello ${b.guestName},\nThis is The Villa Spa. We are writing to confirm your appointment for ${servicesStr} on ${b.date} at ${b.time}.\n\nReceipt ID: ${b.receiptId}\nEstimated Price: ₦${(b.total || 0).toLocaleString()}\n\nWe look forward to pampering you!`
    );
    const waLink = `https://wa.me/${(b.phone || "").replace(/\D/g, '')}?text=${waText}`;
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${b.receiptId || "N/A"}</strong></td>
      <td>${b.guestName}</td>
      <td>
        <div style="display: flex; flex-direction: column;">
          <span><i class="fa-solid fa-phone" style="font-size: 0.75rem;"></i> ${b.phone}</span>
          <span style="font-size: 0.75rem; opacity: 0.7;">${b.email || "No Email"}</span>
        </div>
      </td>
      <td>${b.date} @ ${b.time}</td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${servicesStr}">${servicesStr}</td>
      <td><strong>₦${(b.total || 0).toLocaleString()}</strong></td>
      <td>
        <select class="table-status-select" onchange="changeAppointmentStatus('${b.id || b.receiptId}', this.value)">
          <option value="Pending" ${currentStatus === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Confirmed" ${currentStatus === "Confirmed" ? "selected" : ""}>Confirmed</option>
          <option value="Completed" ${currentStatus === "Completed" ? "selected" : ""}>Completed</option>
          <option value="Cancelled" ${currentStatus === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </td>
      <td>
        <div class="admin-service-actions">
          <a href="${waLink}" target="_blank" class="btn-icon wa" title="WhatsApp Customer"><i class="fab fa-whatsapp"></i></a>
          <button class="btn-icon delete" onclick="deleteAppointment('${b.id || b.receiptId}')" title="Delete Booking"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// Bind live search filters – deferred until DOM is ready
function initAppointmentFilters() {
  const apptSearch = document.getElementById("appointmentSearch");
  const apptFilter = document.getElementById("appointmentFilterStatus");
  if (apptSearch) apptSearch.addEventListener("input", renderAppointmentsTable);
  if (apptFilter) apptFilter.addEventListener("change", renderAppointmentsTable);
}

window.changeAppointmentStatus = async function(id, newStatus) {
  try {
    await updateDoc(doc(db, "bookings", id), { status: newStatus });
    console.log(`Updated status of ${id} to ${newStatus}`);
  } catch (err) {
    console.warn("Firestore update failed, editing localStorage local copy:", err);
    // Local fallback edit
    let localDb = JSON.parse(safeGetItem("tvs_bookings") || "[]");
    const index = localDb.findIndex(b => b.receiptId === id || b.id === id);
    if (index !== -1) {
      localDb[index].status = newStatus;
      safeSetItem("tvs_bookings", JSON.stringify(localDb));
    }
  }
  
  // Hot update in-memory state
  const bIndex = bookings.findIndex(b => b.id === id || b.receiptId === id);
  if (bIndex !== -1) {
    bookings[bIndex].status = newStatus;
  }
  
  renderDashboardOverview();
  renderAppointmentsTable();
  processCustomersLog();
  renderCustomersTable();
};

window.deleteAppointment = async function(id) {
  if (confirm("Are you sure you want to delete this appointment record?")) {
    try {
      await deleteDoc(doc(db, "bookings", id));
      console.log(`Booking ${id} deleted.`);
    } catch (err) {
      console.warn("Firestore delete failed. Deleting local storage fallback copy:", err);
      let localDb = JSON.parse(safeGetItem("tvs_bookings") || "[]");
      const filtered = localDb.filter(b => b.receiptId !== id && b.id !== id);
      safeSetItem("tvs_bookings", JSON.stringify(filtered));
    }
    
    // Wipe local cache
    bookings = bookings.filter(b => b.id !== id && b.receiptId !== id);
    
    renderDashboardOverview();
    renderAppointmentsTable();
    processCustomersLog();
    renderCustomersTable();
  }
};

// ==========================================================================
// 3. RENDER BOOTCAMP TABLE
// ==========================================================================
function renderBootcampTable() {
  const tableBody = document.getElementById("adminBootcampTableBody");
  const searchInput = document.getElementById("bootcampSearch").value.toLowerCase();
  const filterPlan = document.getElementById("bootcampFilterPlan").value;
  
  tableBody.innerHTML = "";
  
  const filtered = bootcampEnrollments.filter(e => {
    const matchesSearch = 
      (e.guestName || "").toLowerCase().includes(searchInput) ||
      (e.phone || "").toLowerCase().includes(searchInput);
      
    const matchesPlan = filterPlan === "all" || e.plan === filterPlan;
    
    return matchesSearch && matchesPlan;
  });
  
  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No student applications found.</td></tr>`;
    return;
  }
  
  filtered.forEach(e => {
    const formattedDate = e.timestamp ? new Date(e.timestamp).toLocaleDateString() : "Seeded";
    const planLabel = e.plan === "premium" ? "Premium Plan (₦350,000)" : "Regular Plan (₦300,000)";
    const currentStatus = e.status || "Pending";
    
    // WhatsApp prompt template
    const waText = encodeURIComponent(
      `Hello ${e.guestName},\nWe received your application for the 4-Week Spa & Esthetics Intensive Bootcamp at The Villa Spa Academy.\n\nPackage: ${planLabel}\n\nWe would like to finalize your registration and organize your starter kit. Please let us know when you are available for a call.`
    );
    const waLink = `https://wa.me/${(e.phone || "").replace(/\D/g, '')}?text=${waText}`;
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td><strong>${e.guestName}</strong></td>
      <td><i class="fa-solid fa-phone" style="font-size: 0.75rem;"></i> ${e.phone}</td>
      <td><span class="badge ${e.plan === "premium" ? "badge-admin" : "btn-outline"}" style="border: 1px solid var(--border-color);">${planLabel}</span></td>
      <td>
        <select class="table-status-select" onchange="changeBootcampStatus('${e.id}', this.value)">
          <option value="Pending" ${currentStatus === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Contacted" ${currentStatus === "Contacted" ? "selected" : ""}>Contacted</option>
          <option value="Paid" ${currentStatus === "Paid" ? "selected" : ""}>Paid</option>
          <option value="Completed" ${currentStatus === "Completed" ? "selected" : ""}>Completed</option>
        </select>
      </td>
      <td>
        <div class="admin-service-actions">
          <a href="${waLink}" target="_blank" class="btn-icon wa" title="WhatsApp Student"><i class="fab fa-whatsapp"></i></a>
          <button class="btn-icon delete" onclick="deleteBootcampEnrollment('${e.id}')" title="Delete Application"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function initBootcampFilters() {
  const bcSearch = document.getElementById("bootcampSearch");
  const bcFilter = document.getElementById("bootcampFilterPlan");
  if (bcSearch) bcSearch.addEventListener("input", renderBootcampTable);
  if (bcFilter) bcFilter.addEventListener("change", renderBootcampTable);
}

window.changeBootcampStatus = async function(id, newStatus) {
  try {
    await updateDoc(doc(db, "bootcamp_enrollments", id), { status: newStatus });
    console.log(`Updated bootcamp status of ${id} to ${newStatus}`);
  } catch (err) {
    console.warn("Firestore update failed, editing local bootcamp storage:", err);
    let local = JSON.parse(safeGetItem("tvs_bootcamp_enrollments") || "[]");
    const index = local.findIndex(e => e.id === id);
    if (index !== -1) {
      local[index].status = newStatus;
      safeSetItem("tvs_bootcamp_enrollments", JSON.stringify(local));
    }
  }
  
  const bIndex = bootcampEnrollments.findIndex(e => e.id === id);
  if (bIndex !== -1) {
    bootcampEnrollments[bIndex].status = newStatus;
  }
  
  renderDashboardOverview();
  renderBootcampTable();
};

window.deleteBootcampEnrollment = async function(id) {
  if (confirm("Are you sure you want to delete this bootcamp application?")) {
    try {
      await deleteDoc(doc(db, "bootcamp_enrollments", id));
      console.log(`Bootcamp application ${id} deleted.`);
    } catch (err) {
      console.warn("Firestore delete failed. Deleting local storage fallback copy:", err);
      let local = JSON.parse(safeGetItem("tvs_bootcamp_enrollments") || "[]");
      const filtered = local.filter(e => e.id !== id);
      safeSetItem("tvs_bootcamp_enrollments", JSON.stringify(filtered));
    }
    
    bootcampEnrollments = bootcampEnrollments.filter(e => e.id !== id);
    
    renderDashboardOverview();
    renderBootcampTable();
    processCustomersLog();
    renderCustomersTable();
  }
};

// ==========================================================================
// 4. RENDER SERVICES / PRODUCTS GRID
// ==========================================================================
function renderServicesGrid() {
  const container = document.getElementById("servicesAdminList");
  container.innerHTML = "";
  
  const categories = ["massages", "facials", "waxing", "body", "nails"];
  const catNames = {
    massages: "Luxury Massages",
    facials: "Facials & Peels",
    waxing: "Waxing & Tinting",
    body: "Body Therapy",
    nails: "Manicures & Pedicures"
  };
  
  categories.forEach(cat => {
    const catItems = services.filter(s => s.category === cat);
    
    const catSection = document.createElement("div");
    catSection.className = "admin-category-section";
    catSection.innerHTML = `
      <h4 class="admin-category-title">${catNames[cat]}</h4>
      <div class="admin-services-subgrid" id="catGrid-${cat}"></div>
    `;
    container.appendChild(catSection);
    
    const subgrid = catSection.querySelector(`#catGrid-${cat}`);
    
    if (catItems.length === 0) {
      subgrid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; font-size: 0.8rem; font-style: italic;">No services added in this category yet.</p>`;
      return;
    }
    
    catItems.forEach(srv => {
      const card = document.createElement("div");
      card.className = "admin-service-card";
      card.innerHTML = `
        <div>
          <div class="admin-service-header">
            <h5 class="admin-service-name">${srv.name}</h5>
            <span class="admin-service-price">₦${srv.price.toLocaleString()}</span>
          </div>
          <p class="admin-service-desc">${srv.desc}</p>
        </div>
        <div class="admin-service-footer">
          <span class="admin-service-duration"><i class="fa-regular fa-clock"></i> ${srv.duration} Mins</span>
          <div class="admin-service-actions">
            <button class="btn-icon edit" onclick="openServiceModal('${srv.id}')" title="Edit Service"><i class="fa-solid fa-pencil"></i></button>
            <button class="btn-icon delete" onclick="deleteService('${srv.id}')" title="Delete Service"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      `;
      subgrid.appendChild(card);
    });
  });
}

// Modal handling (initialized in initServiceModal())
let serviceModal, serviceForm;

window.openServiceModal = function(id = null) {
  serviceForm.reset();
  document.getElementById("serviceEditId").value = "";
  
  if (id) {
    document.getElementById("serviceModalTitle").textContent = "Edit Spa Service";
    const item = services.find(s => s.id === id);
    if (item) {
      document.getElementById("serviceEditId").value = item.id;
      document.getElementById("serviceName").value = item.name;
      document.getElementById("servicePrice").value = item.price;
      document.getElementById("serviceDuration").value = item.duration;
      document.getElementById("serviceCategory").value = item.category;
      document.getElementById("serviceDesc").value = item.desc;
    }
  } else {
    document.getElementById("serviceModalTitle").textContent = "Add New Spa Service";
  }
  
  serviceModal.classList.add("active");
};

window.closeServiceModal = function() {
  serviceModal.classList.remove("active");
};

window.deleteService = async function(id) {
  if (confirm("Are you sure you want to permanently delete this service from the catalog?")) {
    try {
      await deleteDoc(doc(db, "services", id));
      console.log(`Service ${id} deleted.`);
    } catch (err) {
      console.error("Firestore service delete failed:", err);
    }
    
    services = services.filter(s => s.id !== id);
    renderServicesGrid();
    renderAnalyticsCharts();
  }
};

// Handle Service Save
function initServiceModal() {
  serviceModal = document.getElementById("serviceModal");
  serviceForm = document.getElementById("serviceForm");
  if (!serviceForm) return;
serviceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const idInput = document.getElementById("serviceEditId").value;
  const name = document.getElementById("serviceName").value;
  const price = parseInt(document.getElementById("servicePrice").value);
  const duration = parseInt(document.getElementById("serviceDuration").value);
  const category = document.getElementById("serviceCategory").value;
  const desc = document.getElementById("serviceDesc").value;
  
  // If editing, use existing ID. If creating, generate slug ID
  const srvId = idInput || "service-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  
  const record = {
    id: srvId,
    name,
    price,
    duration,
    category,
    desc
  };
  
  const saveBtn = document.getElementById("saveServiceBtn");
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
  
  try {
    await setDoc(doc(db, "services", srvId), record);
    console.log("Service saved in Firestore:", record);
    
    // Update local cache
    const index = services.findIndex(s => s.id === srvId);
    if (index !== -1) {
      services[index] = record;
    } else {
      services.push(record);
    }
    
    renderServicesGrid();
    renderAnalyticsCharts();
    closeServiceModal();
  } catch (err) {
    alert("Could not save to Firestore. Please check connections/rules.");
    console.error(err);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Service";
  }
});
} // end initServiceModal

// ==========================================================================
// 5. RENDER CUSTOMERS DIRECTORY & NOTES
// ==========================================================================
function renderCustomersTable() {
  const tableBody = document.getElementById("adminCustomersTableBody");
  const searchInput = document.getElementById("customerSearch").value.toLowerCase();
  
  tableBody.innerHTML = "";
  
  const filtered = customers.filter(c => {
    return (c.name || "").toLowerCase().includes(searchInput) ||
           (c.phone || "").toLowerCase().includes(searchInput) ||
           (c.email || "").toLowerCase().includes(searchInput);
  });
  
  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No customer logs match search parameters.</td></tr>`;
    return;
  }
  
  filtered.forEach(c => {
    const displayNote = c.notes ? c.notes : `<span class="text-muted" style="font-size: 0.75rem; font-style: italic;">No notes saved.</span>`;
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${c.name}</strong></td>
      <td><i class="fa-solid fa-phone" style="font-size: 0.75rem;"></i> ${c.phone}</td>
      <td>${c.email}</td>
      <td><span class="badge btn-outline" style="border: 1px solid var(--border-color); font-weight: bold;">${c.visits} times</span></td>
      <td><strong class="text-success">₦${c.spent.toLocaleString()}</strong></td>
      <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${c.notes || ''}">${displayNote}</td>
      <td>
        <div class="admin-service-actions">
          <button class="btn-icon edit" onclick="openCustomerModal('${c.phone}', '${c.name}')" title="Edit Customer Notes"><i class="fa-solid fa-pencil"></i></button>
          <a href="https://wa.me/${c.phone.replace(/\D/g, '')}" target="_blank" class="btn-icon wa" title="WhatsApp Customer"><i class="fab fa-whatsapp"></i></a>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function initCustomerModal() {
  const custSearch = document.getElementById("customerSearch");
  if (custSearch) custSearch.addEventListener("input", renderCustomersTable);

  const customerModal = document.getElementById("customerModal");
  const customerForm = document.getElementById("customerForm");
  if (!customerForm) return;

window.openCustomerModal = function(phone, name) {
  document.getElementById("customerPhoneId").value = phone;
  document.getElementById("customerNameDisplay").value = name;
  document.getElementById("customerNotesInput").value = customerNotes[phone] || "";
  customerModal.classList.add("active");
};

window.closeCustomerModal = function() {
  customerModal.classList.remove("active");
};

customerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const phone = document.getElementById("customerPhoneId").value;
  const notes = document.getElementById("customerNotesInput").value;
  
  try {
    // Save to Firestore custom collection
    await setDoc(doc(db, "customers", phone), { notes: notes });
    console.log(`Updated notes for customer ${phone}`);
    customerNotes[phone] = notes;
    
    // Sync customers in-memory cache
    const index = customers.findIndex(c => c.phone === phone);
    if (index !== -1) {
      customers[index].notes = notes;
    }
    
    renderCustomersTable();
    closeCustomerModal();
  } catch (err) {
    alert("Could not update notes in Firestore.");
    console.error(err);
  }
});
} // end initCustomerModal

// ==========================================================================
// 6. RENDER CLIENT REVIEWS
// ==========================================================================
function renderReviewsTable() {
  const tableBody = document.getElementById("adminReviewsTableBody");
  tableBody.innerHTML = "";
  
  if (reviews.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No testimonials added yet.</td></tr>`;
    return;
  }
  
  reviews.forEach(r => {
    const initials = r.guestName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const publishBadge = r.publish 
      ? `<span class="status-badge completed">Live</span>` 
      : `<span class="status-badge cancelled">Hidden</span>`;
    const publishText = r.publish ? "Hide" : "Publish";
    
    let stars = "";
    for (let i = 0; i < (r.rating || 5); i++) stars += "★";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="reviewer-avatar-block">${initials}</div></td>
      <td><strong>${r.guestName}</strong></td>
      <td><span style="color: #C5A880; font-size: 1rem;">${stars}</span></td>
      <td style="max-width: 300px; font-style: italic; opacity: 0.95;" title="${r.text}">${r.text}</td>
      <td>${r.status || "Guest"}</td>
      <td>${publishBadge}</td>
      <td>
        <div class="admin-service-actions">
          <button class="btn btn-xs btn-outline" onclick="toggleReviewPublish('${r.id}', ${r.publish})">${publishText}</button>
          <button class="btn-icon delete" onclick="deleteReview('${r.id}')" title="Delete Review"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function initReviewModal() {
  const reviewModal = document.getElementById("reviewModal");
  const reviewForm = document.getElementById("reviewForm");
  if (!reviewForm) return;

window.openReviewModal = function() {
  reviewForm.reset();
  reviewModal.classList.add("active");
};

window.closeReviewModal = function() {
  reviewModal.classList.remove("active");
};

window.toggleReviewPublish = async function(id, currentPublish) {
  try {
    await updateDoc(doc(db, "reviews", id), { publish: !currentPublish });
    console.log(`Toggled review ${id} publication to ${!currentPublish}`);
  } catch (err) {
    console.error("Firestore update review publish state failed:", err);
  }
  
  const index = reviews.findIndex(r => r.id === id);
  if (index !== -1) {
    reviews[index].publish = !currentPublish;
  }
  
  renderDashboardOverview();
  renderReviewsTable();
};

window.deleteReview = async function(id) {
  if (confirm("Are you sure you want to permanently delete this testimonial?")) {
    try {
      await deleteDoc(doc(db, "reviews", id));
      console.log(`Review ${id} deleted.`);
    } catch (err) {
      console.error("Firestore delete review failed:", err);
    }
    
    reviews = reviews.filter(r => r.id !== id);
    
    renderDashboardOverview();
    renderReviewsTable();
  }
};

reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const guestName = document.getElementById("reviewName").value;
  const rating = parseInt(document.getElementById("reviewStars").value);
  const status = document.getElementById("reviewStatus").value;
  const text = document.getElementById("reviewText").value;
  
  const record = {
    guestName,
    rating,
    status,
    text,
    publish: true,
    timestamp: new Date().toISOString()
  };
  
  try {
    const docRef = await addDoc(collection(db, "reviews"), record);
    console.log("Added testimonial:", docRef.id);
    
    // Add to local state
    reviews.push({ id: docRef.id, ...record });
    
    renderDashboardOverview();
    renderReviewsTable();
    closeReviewModal();
  } catch (err) {
    alert("Could not save review to database.");
    console.error(err);
  }
});
} // end initReviewModal

// ==========================================================================
// CSV EXPORT LOGIC
// ==========================================================================
function initExporters() {
  document.getElementById("exportAppointmentsBtn").addEventListener("click", () => {
    let csv = "Receipt ID,Guest Name,Phone,Email,Date,Time,Services,Total Price,Status\n";
    bookings.forEach(b => {
      const servicesStr = (b.services || []).map(s => s.name).join("; ");
      const status = b.status || "Pending";
      csv += `"${b.receiptId}","${b.guestName}","${b.phone}","${b.email}","${b.date}","${b.time}","${servicesStr}",${b.total},"${status}"\n`;
    });
    downloadCSV(csv, "tvs_appointments_log.csv");
  });
  
  document.getElementById("exportBootcampBtn").addEventListener("click", () => {
    let csv = "Enrollment Date,Student Name,Phone/WhatsApp,Package Chosen,Status\n";
    bootcampEnrollments.forEach(e => {
      const formattedDate = e.timestamp ? new Date(e.timestamp).toLocaleDateString() : "Seeded";
      const plan = e.plan === "premium" ? "Premium (₦350,000)" : "Regular (₦300,000)";
      const status = e.status || "Pending";
      csv += `"${formattedDate}","${e.guestName}","${e.phone}","${plan}","${status}"\n`;
    });
    downloadCSV(csv, "tvs_bootcamp_students.csv");
  });
  
  document.getElementById("exportCustomersBtn").addEventListener("click", () => {
    let csv = "Customer Name,Phone,Email,Total Engagement Count,Total Revenue (₦),Notes\n";
    customers.forEach(c => {
      csv += `"${c.name}","${c.phone}","${c.email}",${c.visits},${c.spent},"${c.notes}"\n`;
    });
    downloadCSV(csv, "tvs_customers_directory.csv");
  });

  const exportOrdersBtn = document.getElementById("exportOrdersBtn");
  if (exportOrdersBtn) {
    exportOrdersBtn.addEventListener("click", () => {
      let csv = "Order Reference,Client Name,Email,Phone,Delivery Address,Items,Total Paid (₦),Fulfillment Status,Date & Time\n";
      orders.forEach(o => {
        const itemsStr = (o.items || []).map(i => `${i.name} (x${i.qty})`).join("; ");
        csv += `"${o.reference}","${o.customerName}","${o.customerEmail}","${o.customerPhone}","${o.deliveryAddress}","${itemsStr}",${o.total},"${o.fulfillment}","${o.timestamp}"\n`;
      });
      downloadCSV(csv, "tvs_sales_orders_log.csv");
    });
  }
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================================================
// WIPE SYSTEM DATA
// ==========================================================================
function initWipeDatabase() {
  document.getElementById("clearAllBookingsBtn").addEventListener("click", async () => {
    if (confirm("⚠️ CAUTION: Are you sure you want to completely clear ALL client appointment records in Firestore? This action is irreversible.")) {
      try {
        const querySnap = await getDocs(collection(db, "bookings"));
        const batch = writeBatch(db);
        querySnap.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log("Firestore client bookings database successfully cleared.");
      } catch (err) {
        console.warn("Firestore bookings wipe failed, clearing localStorage bookings:", err);
      }
      
      safeRemoveItem("tvs_bookings");
      bookings = [];
      
      // Reload and render
      processCustomersLog();
      renderDashboardOverview();
      renderAppointmentsTable();
      renderCustomersTable();
    }
  });
}

function initForms() {
  // Utility hooks to close modals on clicking outside modal card
  window.closeReviewModal = function() {
    document.getElementById("reviewModal").classList.remove("active");
  };
  window.closeServiceModal = function() {
    document.getElementById("serviceModal").classList.remove("active");
  };
  window.closeCustomerModal = function() {
    document.getElementById("customerModal").classList.remove("active");
  };
  window.closeSkincareModal = function() {
    document.getElementById("skincareModal").classList.remove("active");
  };
}

// ==========================================================================
// 10. SKINCARE BOUTIQUE CRUD OPERATIONS
// ==========================================================================
function renderSkincareTable() {
  const tableBody = document.getElementById("adminSkincareTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (skincareProducts.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No skincare boutique products saved yet.</td></tr>`;
    return;
  }

  skincareProducts.forEach(p => {
    const stockClass = p.stock === "out-of-stock" ? "cancelled" : "completed";
    const stockLabel = p.stock === "out-of-stock" ? "Out of Stock" : "In Stock";
    let imgHTML = "";
    if (p.image) {
      imgHTML = `<img src="${p.image}" alt="${p.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: var(--border-radius-sm);">`;
    } else {
      imgHTML = `<i class="fa-solid fa-bottle-droplet" style="font-size: 1.25rem; color: var(--admin-champagne);"></i>`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="width: 60px; text-align: center;">${imgHTML}</td>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge btn-outline" style="border: 1px solid var(--border-color);">${p.category}</span></td>
      <td><strong>₦${p.price.toLocaleString()}</strong></td>
      <td><span class="status-badge ${stockClass}">${stockLabel}</span></td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.desc}">${p.desc}</td>
      <td>
        <div class="admin-service-actions">
          <button class="btn-icon edit" onclick="openSkincareModal('${p.id}')" title="Edit Product"><i class="fa-solid fa-pencil"></i></button>
          <button class="btn-icon delete" onclick="deleteSkincareProduct('${p.id}')" title="Delete Product"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function initSkincareModal() {
  const skincareModal = document.getElementById("skincareModal");
  const skincareForm = document.getElementById("skincareForm");
  if (!skincareForm) return;

window.openSkincareModal = function(id = null) {
  skincareForm.reset();
  document.getElementById("skincareEditId").value = "";
  document.getElementById("skincareModalTitle").textContent = "Add Skincare Product";

  if (id) {
    document.getElementById("skincareModalTitle").textContent = "Edit Skincare Product";
    const item = skincareProducts.find(p => p.id === id);
    if (item) {
      document.getElementById("skincareEditId").value = item.id;
      document.getElementById("skincareName").value = item.name;
      document.getElementById("skincarePrice").value = item.price;
      document.getElementById("skincareCategory").value = item.category;
      document.getElementById("skincareStock").value = item.stock;
      document.getElementById("skincareImage").value = item.image || "";
      document.getElementById("skincareDesc").value = item.desc;
    }
  }
  skincareModal.classList.add("active");
};

window.closeSkincareModal = function() {
  skincareModal.classList.remove("active");
};

window.deleteSkincareProduct = async function(id) {
  if (confirm("Are you sure you want to permanently delete this product from the inventory?")) {
    try {
      await deleteDoc(doc(db, "skincare_products", id));
      console.log(`Product ${id} deleted.`);
    } catch (err) {
      console.error("Firestore product delete failed:", err);
    }
    skincareProducts = skincareProducts.filter(p => p.id !== id);
    renderSkincareTable();
    renderDashboardOverview();
  }
};

skincareForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idInput = document.getElementById("skincareEditId").value;
  const name = document.getElementById("skincareName").value;
  const price = parseInt(document.getElementById("skincarePrice").value);
  const category = document.getElementById("skincareCategory").value;
  const stock = document.getElementById("skincareStock").value;
  const image = document.getElementById("skincareImage").value;
  const desc = document.getElementById("skincareDesc").value;

  const prodId = idInput || "product-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const record = { id: prodId, name, price, category, stock, image, desc };

  const saveBtn = document.getElementById("saveSkincareBtn");
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  try {
    await setDoc(doc(db, "skincare_products", prodId), record);
    console.log("Skincare product saved in Firestore:", record);
    
    const index = skincareProducts.findIndex(p => p.id === prodId);
    if (index !== -1) {
      skincareProducts[index] = record;
    } else {
      skincareProducts.push(record);
    }
    renderSkincareTable();
    renderDashboardOverview();
    closeSkincareModal();
  } catch (err) {
    alert("Could not save skincare product to database.");
    console.error(err);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Product";
  }
});
} // end initSkincareModal

// ==========================================================================
// 11. SALES ORDERS MANAGEMENT (PAYSTACK TRANSACTIONS)
// ==========================================================================
function renderOrdersTable() {
  const tableBody = document.getElementById("adminOrdersTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  const searchInput = document.getElementById("orderSearch").value.toLowerCase();
  const filterFulfillment = document.getElementById("orderFilterFulfillment").value;

  const filtered = orders.filter(o => {
    const matchesSearch = 
      (o.customerName || "").toLowerCase().includes(searchInput) ||
      (o.customerEmail || "").toLowerCase().includes(searchInput) ||
      (o.reference || "").toLowerCase().includes(searchInput);
    
    const fulfillment = o.fulfillment || "Pending";
    const matchesFulfill = filterFulfillment === "all" || fulfillment === filterFulfillment;

    return matchesSearch && matchesFulfill;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No transactions match your search/filter choices.</td></tr>`;
    return;
  }

  filtered.forEach(o => {
    const itemsList = (o.items || []).map(i => `${i.name} (x${i.qty})`).join(", ");
    const formattedDate = o.timestamp ? new Date(o.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A";
    const currentFulfill = o.fulfillment || "Pending";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${o.reference}</strong></td>
      <td>
        <div style="display: flex; flex-direction: column;">
          <strong>${o.customerName}</strong>
          <span style="font-size: 0.75rem; opacity: 0.7;">${o.customerPhone}</span>
          <span style="font-size: 0.72rem; opacity: 0.6; text-decoration: underline;">${o.customerEmail}</span>
        </div>
      </td>
      <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsList}">${itemsList}</td>
      <td><strong class="text-success">₦${o.total.toLocaleString()}</strong></td>
      <td>
        <select class="table-status-select" onchange="changeOrderStatus('${o.reference}', this.value)">
          <option value="Pending" ${currentFulfill === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Shipped" ${currentFulfill === "Shipped" ? "selected" : ""}>Shipped</option>
          <option value="Delivered" ${currentFulfill === "Delivered" ? "selected" : ""}>Delivered</option>
        </select>
      </td>
      <td>${formattedDate}</td>
      <td>
        <div class="admin-service-actions">
          <button class="btn-icon delete" onclick="deleteOrder('${o.reference}')" title="Delete Order"><i class="fa-solid fa-trash-can"></i></button>
          <a href="https://wa.me/${o.customerPhone.replace(/\D/g, '')}" target="_blank" class="btn-icon wa" title="WhatsApp Customer"><i class="fab fa-whatsapp"></i></a>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function initOrderFilters() {
  const orderSearch = document.getElementById("orderSearch");
  const orderFilter = document.getElementById("orderFilterFulfillment");
  if (orderSearch) orderSearch.addEventListener("input", renderOrdersTable);
  if (orderFilter) orderFilter.addEventListener("change", renderOrdersTable);
}

window.changeOrderStatus = async function(reference, newStatus) {
  try {
    await updateDoc(doc(db, "orders", reference), { fulfillment: newStatus });
    console.log(`Updated fulfillment status of order ${reference} to ${newStatus}`);
  } catch (err) {
    console.warn("Firestore update order status failed, updating local copy:", err);
    let local = JSON.parse(safeGetItem("tvs_orders") || "[]");
    const index = local.findIndex(o => o.reference === reference);
    if (index !== -1) {
      local[index].fulfillment = newStatus;
      safeSetItem("tvs_orders", JSON.stringify(local));
    }
  }

  const oIndex = orders.findIndex(o => o.reference === reference);
  if (oIndex !== -1) {
    orders[oIndex].fulfillment = newStatus;
  }
  renderOrdersTable();
};

window.deleteOrder = async function(reference) {
  if (confirm("Are you sure you want to permanently delete this sales transaction?")) {
    try {
      await deleteDoc(doc(db, "orders", reference));
      console.log(`Order ${reference} deleted.`);
    } catch (err) {
      console.warn("Firestore order delete failed, deleting local copy:", err);
      let local = JSON.parse(safeGetItem("tvs_orders") || "[]");
      const filtered = local.filter(o => o.reference !== reference);
      safeSetItem("tvs_orders", JSON.stringify(filtered));
    }
    orders = orders.filter(o => o.reference !== reference);
    renderOrdersTable();
    renderDashboardOverview();
  }
};
