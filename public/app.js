// app.js — minimal v2 patch (only safe fixes: always render after snapshot, date normalization, small logs)
// Load as module: <script type="module" src="app.js"></script>

/* ===========================
   Imports (Firebase modular)
   =========================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc,
  onSnapshot, query, orderBy, where,
  updateDoc, serverTimestamp, getDocs,
  deleteDoc     // ← THIS WAS MISSING
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import {
  getAuth, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ===========================
   Firebase configuration
   =========================== */
const firebaseConfig = {
  apiKey: "AIzaSyDnolv5fR5IuriMhMibLu8AIWqLk43nJnw",
  authDomain: "ajsm-vms.firebaseapp.com",
  projectId: "ajsm-vms",
  storageBucket: "ajsm-vms.firebasestorage.app",
  messagingSenderId: "1085957630720",
  appId: "1:1085957630720:web:80a6c0c66c842c69a5a1e5",
  measurementId: "G-TP5LM1GP44"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics?.(app);
const auth = getAuth(app);

/* ===========================
   Globals & state
   =========================== */
let currentUser = null;
let visitors = [];            // local cache kept in sync by Firestore onSnapshot
let currentQRDataUrl = null;  // last generated QR data URL (for download)
let availableCameras = [];
let currentCameraIndex = 0;


/* ===========================
   Utilities / helper functions
   =========================== */

function normalizeToYMD(input) {
  // Accepts: "2025-11-17", "2025-11-17T09:30:00.000Z", Date object, null
  if (!input) return null;
  try {
    if (input instanceof Date) {
      return input.toISOString().split('T')[0];
    }
    // If Firestore stored as serverTimestamp object from console, convert via toDate if exists
    if (typeof input.toDate === 'function') {
      return input.toDate().toISOString().split('T')[0];
    }
    // Otherwise try parse string as Date
    const d = new Date(String(input));
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    // Fallback: return input if already looks like YYYY-MM-DD
    const m = String(input).match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : String(input);
  } catch (e) {
    console.debug('normalizeToYMD error', e, input);
    return String(input);
  }
}

/**
 * Create ISO expiry (24 hours from scheduled datetime)
 */
function calculateExpiryDate(date, time) {
  if (!date || !time) return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const scheduledDateTime = new Date(`${date}T${time}`);
  scheduledDateTime.setHours(scheduledDateTime.getHours() + 24);
  return scheduledDateTime.toISOString();
}

/**
 * Format ISO datetime to readable local string
 */
function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date string to readable form
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/* ===========================
   Navigation & role protection
   =========================== */

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(pageId);
  if (el) el.classList.add('active');

  // call page hooks
  if (pageId === 'adminDashboard') updateAdminDashboard();
  if (pageId === 'deskDashboard') updateDeskDashboard();
}

/**
 * Secure navigation that enforces role-based access, and triggers onNavigate hooks
 */
function secureNavigateTo(pageId) {
  if (pageId === "adminDashboard" && currentUser?.role !== "admin") {
    alert("Unauthorized access: Admin only");
    return;
  }
  if (pageId === "deskDashboard" && currentUser?.role !== "desk") {
    alert("Unauthorized access: Desk personnel only");
    return;
  }
  navigateTo(pageId);
}

/* ===========================
   Firestore real-time sync
   =========================== */

// Keep visitors in sync with Firestore in real-time
onSnapshot(
  query(collection(db, "visitors"), orderBy("createdAt", "desc")),
  (snapshot) => {
    visitors = [];
    snapshot.forEach(doc => {
      visitors.push({ ...doc.data(), _docId: doc.id });
    });

    // ALWAYS refresh dashboards when data changes.
    // This avoids the race where snapshot fired before the page became active.
    try {
      updateAdminDashboard();
      updateDeskDashboard();
    } catch (e) {
      console.debug("update dashboards after snapshot failed", e);
    }

    console.debug("visitors sync:", visitors.length, "entries");
  },
  (err) => {
    console.error("Firestore onSnapshot error:", err);
  }
);

/* ===========================
   Authentication
   =========================== */

async function handleAdminLogin(event) {
  event?.preventDefault?.();
  const email = (document.getElementById('adminUsername')?.value || '').trim();
  const password = (document.getElementById('adminPassword')?.value || '').trim();
  const errorDiv = document.getElementById('adminLoginError');

  try {
    await signInWithEmailAndPassword(auth, email, password);
    if (errorDiv) errorDiv.style.display = 'none';
  } catch (err) {
    console.error("Admin login error:", err);
    if (errorDiv) {
      errorDiv.textContent = "Invalid credentials";
      errorDiv.style.display = "block";
    }
  }
}

async function handleDeskLogin(event) {
  event?.preventDefault?.();
  const email = (document.getElementById('deskUsername')?.value || '').trim();
  const password = (document.getElementById('deskPassword')?.value || '').trim();
  const errorDiv = document.getElementById('deskLoginError');

  try {
    await signInWithEmailAndPassword(auth, email, password);
    if (errorDiv) errorDiv.style.display = 'none';
  } catch (err) {
    console.error("Desk login error:", err);
    if (errorDiv) {
      errorDiv.textContent = "Invalid credentials";
      errorDiv.style.display = "block";
    }
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
    currentUser = null;
    navigateTo('welcomePage');
  } catch (err) {
    console.error("Logout error:", err);
    alert("Logout failed");
  }
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    currentUser = null;
    navigateTo('welcomePage');
    return;
  }

  const email = (user.email || '').toLowerCase();
  if (email === 'admin@ajsm.edu') {
    currentUser = { role: 'admin', email };
    secureNavigateTo('adminDashboard');
    // ensure table renders right away
    updateAdminDashboard();
  } else if (email === 'desk@ajsm.edu') {
    currentUser = { role: 'desk', email };
    secureNavigateTo('deskDashboard');
    updateDeskDashboard();
  } else {
    currentUser = { role: 'guest', email };
    navigateTo('guestRegistrationPage');
  }
});

/* ===========================
   Admin dashboard & Desk dashboard rendering
   =========================== */

function updateAdminDashboard() {
  const today = new Date().toISOString().split("T")[0];

  // normalize scheduledDate values so comparison is robust across formats/timezones
  const todaysVisitors = visitors.filter(v => {
    const s = normalizeToYMD(v.scheduledDate);
    return s === today;
  });

  const checkedIn = visitors.filter(v => v.status === "checked-in");
  const checkedOut = visitors.filter(v => v.status === "checked-out");

  const statTotal = document.getElementById("statTotalEntries");
  const statPresent = document.getElementById("statCurrentlyPresent");
  const statChecked = document.getElementById("statCheckedOut");

  if (statTotal) statTotal.textContent = todaysVisitors.length;
  if (statPresent) statPresent.textContent = checkedIn.length;
  if (statChecked) statChecked.textContent = checkedOut.length;

  const tableBody = document.getElementById('adminVisitorTable');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  // render all visitors (keeps behaviour same as before)
  visitors.forEach(visitor => {
    const row = document.createElement('tr');

    const viewBtn = `<button class="btn-secondary" onclick="viewVisitorDetails('${visitor.id}')">View</button>`;
    const checkoutBtn = visitor.status === 'checked-in'
      ? `<button class="btn-primary ml-2" onclick="checkoutVisitor('${visitor.id}')">Check-Out</button>`
      : '';
      const deleteBtn = `<button class="btn-secondary ml-2" style="background:#b91c1c; color:white;" onclick="deleteVisitor('${visitor.id}')">Delete</button>`;


    row.innerHTML = `
      <td>${visitor.id || ''}</td>
      <td>${visitor.name || ''}</td>
      <td>${visitor.mobile || ''}</td>
      <td>${visitor.cardNumber || 'Not Issued'}</td>
      <td>${visitor.purpose || 'N/A'}</td>
      <td>${visitor.scheduledDate || 'N/A'}</td>
      <td>${formatDateTime(visitor.checkInTime)}</td>
      <td><span class="status-badge ${visitor.status === 'checked-in' ? 'status-checkedin' : 'status-checkedout'}">${visitor.status || 'N/A'}</span></td>
      <td>${viewBtn} ${checkoutBtn} ${deleteBtn}</td>
    `;

    tableBody.appendChild(row);
  });

  console.debug("Admin table rendered:", tableBody.children.length, "rows");
}

function updateDeskDashboard() {
  const currentVisitors = visitors.filter(v =>
  v.status === 'checked-in');
  const deskCountEl = document.getElementById("deskCurrentCount");
  if (deskCountEl) deskCountEl.textContent = currentVisitors.length;

  const tableBody = document.getElementById('deskVisitorTable');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (currentVisitors.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" style="text-align:center; padding:20px; color:#999;">No visitors currently present</td>';
    tableBody.appendChild(row);
    return;
  }

  currentVisitors.forEach(visitor => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${visitor.name}</td>
      <td>${visitor.mobile}</td>
      <td>${visitor.cardNumber || "-"}</td>
      <td>${formatDateTime(visitor.checkInTime)}</td>
      <td>${visitor.purpose || 'N/A'}</td>
      <td><button class="btn-secondary" onclick="checkoutVisitor('${visitor.id}')">Check-Out</button></td>
    `;
    tableBody.appendChild(row);
  });

  console.debug("Desk table rendered:", tableBody.children.length, "rows");
}

/* ===========================
   Add / Register visitors (unchanged)
   =========================== */

async function handleAddGuest(event) {
  event?.preventDefault?.();

  const name = (document.getElementById('addGuestName')?.value || '').trim();
  const mobile = (document.getElementById('addGuestMobile')?.value || '').trim();
  const purpose = (document.getElementById('addGuestPurpose')?.value || 'Meeting').trim();
  const dateTime = (document.getElementById('addGuestDateTime')?.value || '').trim();
  const assignedTo = (document.getElementById('addGuestAssignedTo')?.value || '').trim();

  if (!name || !mobile || !dateTime) {
    alert("Please fill required fields");
    return;
  }

  const id = `VIS${Date.now()}`;

  const visitor = {
    id,
    name,
    mobile,
    checkInTime: new Date(dateTime).toISOString(),
    checkOutTime: null,
    status: 'checked-in',
    purpose,
    scheduledDate: dateTime.split('T')[0],
    scheduledTime: dateTime.split('T')[1],
    assignedTo,
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "visitors"), visitor);
    closeAddGuestModal();
  } catch (err) {
    console.error("Error adding guest:", err);
    alert("Failed to add guest");
  }
}

async function handleGuestRegistration(event) {
  event?.preventDefault?.();

  const name = (document.getElementById('guestName')?.value || '').trim();
  const mobile = (document.getElementById('guestMobile')?.value || '').trim();
  let purpose = (document.getElementById('guestPurpose')?.value || '').trim();
  const visitDate = (document.getElementById('visitDate')?.value || '').trim();
  const visitTime = (document.getElementById('visitTime')?.value || '').trim();
  const duration = (document.getElementById('visitDuration')?.value || '').trim();

  if (!name || !mobile || !visitDate || !visitTime) {
    alert("Please fill required fields");
    return;
  }

  if (purpose === 'Other') {
    purpose = (document.getElementById('otherPurposeText')?.value || '').trim();
  }

  const id = `VIS${Date.now()}`;

  const visitor = {
    id,
    name,
    mobile,
    purpose,
    duration: `${duration} hours`,
    scheduledDate: visitDate,
    scheduledTime: visitTime,
    status: "scheduled",
    assignedTo: "Awaiting Assignment",
    checkInTime: null,
    checkOutTime: null,
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "visitors"), visitor);

    const qrData = JSON.stringify({
      id,
      name,
      mobile,
      scheduledDate: visitDate,
      scheduledTime: visitTime,
      purpose,
      validUntil: calculateExpiryDate(visitDate, visitTime)
    });

    generateQRCode(qrData, name, visitDate, visitTime);

    document.getElementById('guestName').value = '';
    document.getElementById('guestMobile').value = '';
    document.getElementById('guestPurpose').value = '';
    document.getElementById('visitDate').value = '';
    document.getElementById('visitTime').value = '';
    document.getElementById('visitDuration').value = '';
    document.getElementById('otherPurposeText').value = '';
    document.getElementById('otherPurposeContainer').style.display = 'none';
  } catch (err) {
    console.error("Registration error:", err);
    alert("Failed to register guest");
  }
}

/* ===========================
   QR Code generation (unchanged)
   =========================== */

function generateQRCode(data, name, date, time) {
  const container = document.getElementById('qrCodeContainer');
  if (!container) return;
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  try {
    QRCode.toCanvas(canvas, data, {
      width: 250,
      margin: 2,
      color: { dark: '#3E2723', light: '#FFFFFF' }
    }, (error) => {
      if (error) console.error("QRCode.toCanvas error:", error);
    });

    QRCode.toDataURL(data, {
      width: 250,
      margin: 2,
      color: { dark: '#3E2723', light: '#FFFFFF' }
    }, (err, url) => {
      if (err) console.error("QRCode.toDataURL error:", err);
      currentQRDataUrl = url;
    });

    const message = `Your visit has been scheduled for ${formatDate(date)} at ${time}. This QR code is valid for 24 hours from your scheduled time.`;
    document.getElementById('qrSuccessMessage').textContent = message;
    document.getElementById('qrSuccessModal').classList.add('active');
  } catch (e) {
    console.error("generateQRCode error:", e);
    alert("Failed to generate QR code");
  }
}

function closeQRSuccessModal() {
  document.getElementById('qrSuccessModal')?.classList.remove('active');
}

function downloadQRCode() {
  if (!currentQRDataUrl) return;
  const link = document.createElement('a');
  link.download = 'visitor-qr-code.png';
  link.href = currentQRDataUrl;
  link.click();
}

/* ===========================
   Export / search / utilities
   =========================== */

function exportToCSV() {
  const headers = ['ID','Name','Mobile','Purpose','Scheduled Date','Check-in Time','Check-out Time','Status','Assigned To'];
  const rows = visitors.map(v => [
    v.id, v.name, v.mobile, v.purpose || 'N/A', v.scheduledDate || 'N/A',
    v.checkInTime || 'N/A', v.checkOutTime || 'N/A', v.status, v.assignedTo || 'N/A'
  ]);

  let csv = headers.join(',') + '\n';
  rows.forEach(r => { csv += r.join(',') + '\n'; });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'visitors_export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function filterVisitors() {
  const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const tableBody = document.getElementById('adminVisitorTable');
  if (!tableBody) return;
  const rows = tableBody.getElementsByTagName('tr');
  Array.from(rows).forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

/* ===========================
   View details modal
   =========================== */

function viewVisitorDetails(visitorId) {
  const visitor = visitors.find(v => v.id === visitorId);
  if (!visitor) return;
  const content = document.getElementById('visitorDetailsContent');
  if (!content) return;

  content.innerHTML = `
    <div style="line-height: 2;">
      <p><strong>ID:</strong> ${visitor.id}</p>
      <p><strong>Name:</strong> ${visitor.name}</p>
      <p><strong>Mobile:</strong> ${visitor.mobile}</p>
      <p><strong>Purpose:</strong> ${visitor.purpose || 'N/A'}</p>
      <p><strong>Scheduled Date:</strong> ${visitor.scheduledDate || 'N/A'}</p>
      <p><strong>Scheduled Time:</strong> ${visitor.scheduledTime || 'N/A'}</p>
      <p><strong>Check-in Time:</strong> ${formatDateTime(visitor.checkInTime)}</p>
      <p><strong>Check-out Time:</strong> ${visitor.checkOutTime ? formatDateTime(visitor.checkOutTime) : 'Still Present'}</p>
      <p><strong>Status:</strong> <span class="status-badge ${visitor.status === 'checked-in' ? 'status-checkedin' : 'status-checkedout'}">${visitor.status || 'N/A'}</span></p>
      <p><strong>Assigned To:</strong> ${visitor.assignedTo || 'N/A'}</p>
    </div>
  `;

  document.getElementById('viewDetailsModal')?.classList.add('active');
}
function closeViewDetailsModal() { document.getElementById('viewDetailsModal')?.classList.remove('active'); }

/* ===========================
   Add Guest modal helpers
   =========================== */
function openAddGuestModal() {
  document.getElementById('addGuestModal')?.classList.add('active');
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16);
  const input = document.getElementById('addGuestDateTime');
  if (input) input.value = localDateTime;
}
function closeAddGuestModal() {
  document.getElementById('addGuestModal')?.classList.remove('active');
  ['addGuestName','addGuestMobile','addGuestPurpose','addGuestDateTime','addGuestAssignedTo'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
}

/* ===========================
   QR Scanner
   =========================== */

let qrScanner = null;
let qrScannerInitialized = false;

async function handleQRScan(decodedText) {
    const display = document.getElementById("qr-reader-results");
    display.innerText = "QR detected. Checking visitor…";

    try {
        const qrData = JSON.parse(decodedText);
        await processQRCheckIn(qrData);
    } catch (err) {
        display.innerText = "❌ Invalid QR code";
        return;
    }

    try {
        await qrScanner.stop();
    } catch (_) {}

    display.innerText = "✅ Check-in successful!";
}


/* -- OPEN SCANNER (DESK) -- */
function openDeskScanner() {
    secureNavigateTo("qrScannerPageDesk");

    // Wait until new page is actually visible
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            initializeDeskScanner();
        });
    });
}


function initializeDeskScanner() {
    if (qrScannerInitialized) return;

    const element = document.getElementById("qr-reader");

    if (!element) {
        alert("❌ Scanner element missing.");
        return;
    }

    qrScanner = new Html5Qrcode("qr-reader");

    Html5Qrcode.getCameras()
        .then(cameras => {
        availableCameras = cameras;   // ← store
        currentCameraIndex = 0;
            if (!cameras || cameras.length === 0) {
                alert("❌ No cameras found on this device.");
                return;
            }

            // Prefer back camera if exists
            const backCam = cameras.find(cam =>
            cam.label.toLowerCase().includes("back") ||
            cam.label.toLowerCase().includes("environment")
        );

        const selectedCam = backCam || cameras[0]; // fallback to first if no back cam

        qrScanner.start(
            selectedCam.id,
            { fps: 10, qrbox: 250 },
            qrData => handleQRScan(qrData)
        );


            qrScannerInitialized = true;
        })
        .catch(err => {
            alert("❌ Camera permission denied or unavailable.\nCheck browser settings.");
            console.error(err);
        });
}


async function switchCamera() {
    if (!qrScanner || availableCameras.length === 0) {
        alert("No cameras available.");
        return;
    }

    try {
        await qrScanner.stop();
    } catch (_) {}

    currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;

    qrScanner.start(
        availableCameras[currentCameraIndex].id,
        { fps: 10, qrbox: 250 },
        qrData => handleQRScan(qrData)
    );

    alert("Camera switched");
}

/* ----------------------------
   CHECK-IN LOGIC WITH VALIDATION
   ---------------------------- */
async function processQRCheckIn(qrData) {
    // Query instead of doc() because visitors use auto-ID
    const q = query(
        collection(db, "visitors"),
        where("id", "==", qrData.id)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
        alert("❌ Invalid QR: Visitor not found.");
        return;
    }

    const docRef = snap.docs[0].ref;
    const data = snap.docs[0].data();

    const today = new Date().toISOString().split("T")[0];

    // ---- DATE VALIDATION ----
    if (data.scheduledDate !== today) {
        alert(`❌ Wrong date.\nScheduled for: ${data.scheduledDate}`);
        return;
    }

    // ---- TIME VALIDATION ----
    const now = new Date();
    const start = new Date(`${data.scheduledDate}T${data.scheduledTime}`);

    if (now < start) {
        alert(`⏳ Too early to check-in.\nAllowed after: ${data.scheduledTime}`);
        return;
    }

    // ---- Already Checked-in ----
    if (data.status === "checked-in") {
        alert("ℹ Already checked in.");
        return;
    }

      // Ask desk person to assign card number
      const cardNumber = prompt("Enter issued card number (RFID):");

      if (!cardNumber || cardNumber.trim() === "") {
          alert("❌ Card number is required for check-in.");
          return;
      }

      await updateDoc(docRef, {
          status: "checked-in",
          cardNumber,
          checkInTime: now.toISOString()
      });

      alert(`✅ Check-in successful\nAssigned Card: ${cardNumber}`);


    alert("✅ Check-in successful");
}


/* ===========================
   Small UX helpers (unchanged)
   =========================== */

function toggleOtherPurpose() {
  const purpose = document.getElementById('guestPurpose')?.value;
  const otherContainer = document.getElementById('otherPurposeContainer');
  if (!otherContainer) return;
  if (purpose === 'Other') {
    otherContainer.style.display = 'block';
    document.getElementById('otherPurposeText').required = true;
  } else {
    otherContainer.style.display = 'none';
    document.getElementById('otherPurposeText').required = false;
  }
}

async function checkoutVisitor(visitorId) {
  try {
    const q = query(collection(db, "visitors"), where("id", "==", visitorId));
    const snap = await getDocs(q);

    if (snap.empty) {
      alert("Visitor not found.");
      return;
    }

    const docRef = snap.docs[0].ref;
    const data = snap.docs[0].data();

    // 🚫 Prevent checkout if not checked-in
    if (data.status !== "checked-in") {
      alert("❌ Cannot check-out. Visitor is not checked in.");
      return;
    }

    await updateDoc(docRef, {
      status: "checked-out",
      checkOutTime: new Date().toISOString()
    });

    alert("Visitor checked out successfully.");
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Failed to check out visitor.");
  }
}


async function deleteVisitor(visitorId) {
  const confirmation = confirm("Are you sure you want to delete this visitor?\nThis action cannot be undone.");

  if (!confirmation) return;

  try {
    const q = query(collection(db, "visitors"), where("id", "==", visitorId));
    const snap = await getDocs(q);

    if (snap.empty) {
      alert("Visitor not found.");
      return;
    }

    for (const doc of snap.docs) {
      await deleteDoc(doc.ref);
    }

    alert("Visitor deleted successfully.");
  } catch (err) {
    console.error("Error deleting visitor:", err);
    alert("Failed to delete visitor.");
  }
}


window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const visitDateInput = document.getElementById('visitDate');
  if (visitDateInput) visitDateInput.min = today;
});

/* ===========================
   Expose functions to window (unchanged)
   =========================== */
window.secureNavigateTo = secureNavigateTo;
window.handleAdminLogin = handleAdminLogin;
window.handleDeskLogin = handleDeskLogin;
window.handleLogout = handleLogout;
window.openAddGuestModal = openAddGuestModal;
window.closeAddGuestModal = closeAddGuestModal;
window.handleAddGuest = handleAddGuest;
window.toggleOtherPurpose = toggleOtherPurpose;
window.handleGuestRegistration = handleGuestRegistration;
window.downloadQRCode = downloadQRCode;
window.closeQRSuccessModal = closeQRSuccessModal;
window.exportToCSV = exportToCSV;
window.filterVisitors = filterVisitors;
window.viewVisitorDetails = viewVisitorDetails;
window.closeViewDetailsModal = closeViewDetailsModal;
window.refreshDeskView = () => updateDeskDashboard();
window.checkoutVisitor = checkoutVisitor;
window.deleteVisitor = deleteVisitor;
window.openDeskScanner = openDeskScanner;
window.handleQRScan = handleQRScan;
window.processQRCheckIn = processQRCheckIn;


/* ===========================
   End of app.js v2 patch
   =========================== */
