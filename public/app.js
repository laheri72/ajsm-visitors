// In-memory data storage
let visitors = [
  {
    id: 'VIS001',
    name: 'Ahmed Hassan',
    mobile: '9876543210',
    checkInTime: '2025-11-17T09:30:00',
    checkOutTime: null,
    status: 'checked-in',
    purpose: 'Meeting',
    scheduledDate: '2025-11-17',
    scheduledTime: '09:30',
    assignedTo: 'Administration'
  }
];

let currentUser = null;
let visitorCounter = 2;
let currentQRDataUrl = null;

// Credentials
const credentials = {
  admin: { username: 'admin', password: 'admin123' },
  desk: { username: 'desk', password: 'desk123' }
};

// Navigation
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
  
  // Update dashboards when navigating to them
  if (pageId === 'adminDashboard') {
    updateAdminDashboard();
  } else if (pageId === 'deskDashboard') {
    updateDeskDashboard();
  }
}

// Admin Login
function handleAdminLogin(event) {
  event.preventDefault();
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  const errorDiv = document.getElementById('adminLoginError');
  
  if (username === credentials.admin.username && password === credentials.admin.password) {
    currentUser = { role: 'admin', username };
    errorDiv.style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    navigateTo('adminDashboard');
  } else {
    errorDiv.textContent = 'Invalid username or password';
    errorDiv.style.display = 'block';
  }
}

// Desk Login
function handleDeskLogin(event) {
  event.preventDefault();
  const username = document.getElementById('deskUsername').value;
  const password = document.getElementById('deskPassword').value;
  const errorDiv = document.getElementById('deskLoginError');
  
  if (username === credentials.desk.username && password === credentials.desk.password) {
    currentUser = { role: 'desk', username };
    errorDiv.style.display = 'none';
    document.getElementById('deskUsername').value = '';
    document.getElementById('deskPassword').value = '';
    navigateTo('deskDashboard');
  } else {
    errorDiv.textContent = 'Invalid username or password';
    errorDiv.style.display = 'block';
  }
}

// Logout
function handleLogout() {
  currentUser = null;
  navigateTo('welcomePage');
}

// Update Admin Dashboard
function updateAdminDashboard() {
  // Update statistics
  const totalEntries = visitors.length;
  const currentlyPresent = visitors.filter(v => v.status === 'checked-in').length;
  const checkedOut = visitors.filter(v => v.status === 'checked-out').length;
  
  document.getElementById('statTotalEntries').textContent = totalEntries;
  document.getElementById('statCurrentlyPresent').textContent = currentlyPresent;
  document.getElementById('statCheckedOut').textContent = checkedOut;
  
  // Update table
  const tableBody = document.getElementById('adminVisitorTable');
  tableBody.innerHTML = '';
  
  visitors.forEach(visitor => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${visitor.id}</td>
      <td>${visitor.name}</td>
      <td>${visitor.mobile}</td>
      <td>${visitor.purpose || 'N/A'}</td>
      <td>${visitor.scheduledDate || 'N/A'}</td>
      <td>${formatDateTime(visitor.checkInTime)}</td>
      <td><span class="status-badge ${visitor.status === 'checked-in' ? 'status-checkedin' : 'status-checkedout'}">${visitor.status}</span></td>
      <td>
        <button class="btn-secondary" style="padding: 6px 12px; font-size: 14px;" onclick="viewVisitorDetails('${visitor.id}')">View</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Update Desk Dashboard
function updateDeskDashboard() {
  const currentVisitors = visitors.filter(v => v.status === 'checked-in');
  document.getElementById('deskCurrentCount').textContent = currentVisitors.length;
  
  const tableBody = document.getElementById('deskVisitorTable');
  tableBody.innerHTML = '';
  
  if (currentVisitors.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" style="text-align: center; padding: 20px; color: #999;">No visitors currently present</td>';
    tableBody.appendChild(row);
  } else {
    currentVisitors.forEach(visitor => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${visitor.name}</td>
        <td>${visitor.mobile}</td>
        <td>${formatDateTime(visitor.checkInTime)}</td>
        <td>${visitor.purpose || 'N/A'}</td>
        <td>
          <button class="btn-secondary" style="padding: 6px 12px; font-size: 14px;" onclick="checkoutVisitor('${visitor.id}')">Check Out</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
}

// Refresh Desk View
function refreshDeskView() {
  updateDeskDashboard();
}

// Checkout Visitor
function checkoutVisitor(visitorId) {
  const visitor = visitors.find(v => v.id === visitorId);
  if (visitor) {
    visitor.status = 'checked-out';
    visitor.checkOutTime = new Date().toISOString();
    updateDeskDashboard();
  }
}

// Filter Visitors (Admin)
function filterVisitors() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const tableBody = document.getElementById('adminVisitorTable');
  const rows = tableBody.getElementsByTagName('tr');
  
  Array.from(rows).forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// View Visitor Details
function viewVisitorDetails(visitorId) {
  const visitor = visitors.find(v => v.id === visitorId);
  if (!visitor) return;
  
  const content = document.getElementById('visitorDetailsContent');
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
      <p><strong>Status:</strong> <span class="status-badge ${visitor.status === 'checked-in' ? 'status-checkedin' : 'status-checkedout'}">${visitor.status}</span></p>
      <p><strong>Assigned To:</strong> ${visitor.assignedTo || 'N/A'}</p>
    </div>
  `;
  
  document.getElementById('viewDetailsModal').classList.add('active');
}

function closeViewDetailsModal() {
  document.getElementById('viewDetailsModal').classList.remove('active');
}

// Add Guest Modal
function openAddGuestModal() {
  document.getElementById('addGuestModal').classList.add('active');
  // Set default datetime to now
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.getElementById('addGuestDateTime').value = localDateTime;
}

function closeAddGuestModal() {
  document.getElementById('addGuestModal').classList.remove('active');
  document.getElementById('addGuestName').value = '';
  document.getElementById('addGuestMobile').value = '';
  document.getElementById('addGuestPurpose').value = 'Meeting';
  document.getElementById('addGuestDateTime').value = '';
  document.getElementById('addGuestAssignedTo').value = '';
}

function handleAddGuest(event) {
  event.preventDefault();
  
  const name = document.getElementById('addGuestName').value;
  const mobile = document.getElementById('addGuestMobile').value;
  const purpose = document.getElementById('addGuestPurpose').value;
  const dateTime = document.getElementById('addGuestDateTime').value;
  const assignedTo = document.getElementById('addGuestAssignedTo').value;
  
  const visitor = {
    id: `VIS${String(visitorCounter).padStart(3, '0')}`,
    name,
    mobile,
    checkInTime: new Date(dateTime).toISOString(),
    checkOutTime: null,
    status: 'checked-in',
    purpose,
    scheduledDate: dateTime.split('T')[0],
    scheduledTime: dateTime.split('T')[1],
    assignedTo
  };
  
  visitors.push(visitor);
  visitorCounter++;
  
  closeAddGuestModal();
  updateAdminDashboard();
}

// Guest Registration
function toggleOtherPurpose() {
  const purpose = document.getElementById('guestPurpose').value;
  const otherContainer = document.getElementById('otherPurposeContainer');
  
  if (purpose === 'Other') {
    otherContainer.style.display = 'block';
    document.getElementById('otherPurposeText').required = true;
  } else {
    otherContainer.style.display = 'none';
    document.getElementById('otherPurposeText').required = false;
  }
}

function handleGuestRegistration(event) {
  event.preventDefault();
  
  const name = document.getElementById('guestName').value;
  const mobile = document.getElementById('guestMobile').value;
  let purpose = document.getElementById('guestPurpose').value;
  const visitDate = document.getElementById('visitDate').value;
  const visitTime = document.getElementById('visitTime').value;
  const duration = document.getElementById('visitDuration').value;
  
  if (purpose === 'Other') {
    purpose = document.getElementById('otherPurposeText').value;
  }
  
  // Create visitor object
  const visitor = {
    id: `VIS${String(visitorCounter).padStart(3, '0')}`,
    name,
    mobile,
    checkInTime: new Date().toISOString(),
    checkOutTime: null,
    status: 'checked-in',
    purpose,
    scheduledDate: visitDate,
    scheduledTime: visitTime,
    duration: `${duration} hours`,
    assignedTo: 'Awaiting Assignment'
  };
  
  visitors.push(visitor);
  visitorCounter++;
  
  // Generate QR Code
  const qrData = JSON.stringify({
    id: visitor.id,
    name: visitor.name,
    mobile: visitor.mobile,
    scheduledDate: visitDate,
    scheduledTime: visitTime,
    purpose: purpose,
    validUntil: calculateExpiryDate(visitDate, visitTime)
  });
  
  generateQRCode(qrData, name, visitDate, visitTime);
  
  // Reset form
  document.getElementById('guestName').value = '';
  document.getElementById('guestMobile').value = '';
  document.getElementById('guestPurpose').value = '';
  document.getElementById('visitDate').value = '';
  document.getElementById('visitTime').value = '';
  document.getElementById('visitDuration').value = '';
  document.getElementById('otherPurposeText').value = '';
  document.getElementById('otherPurposeContainer').style.display = 'none';
}

function calculateExpiryDate(date, time) {
  const scheduledDateTime = new Date(`${date}T${time}`);
  scheduledDateTime.setHours(scheduledDateTime.getHours() + 24);
  return scheduledDateTime.toISOString();
}

function generateQRCode(data, name, date, time) {
  const container = document.getElementById('qrCodeContainer');
  container.innerHTML = '';
  
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  QRCode.toCanvas(canvas, data, {
    width: 250,
    margin: 2,
    color: {
      dark: '#3E2723',
      light: '#FFFFFF'
    }
  }, function(error) {
    if (error) console.error(error);
  });
  
  // Store for download
  QRCode.toDataURL(data, {
    width: 250,
    margin: 2,
    color: {
      dark: '#3E2723',
      light: '#FFFFFF'
    }
  }, function(err, url) {
    if (err) console.error(err);
    currentQRDataUrl = url;
  });
  
  const message = `Your visit has been scheduled for ${formatDate(date)} at ${time}. This QR code is valid for 24 hours from your scheduled time.`;
  document.getElementById('qrSuccessMessage').textContent = message;
  document.getElementById('qrSuccessModal').classList.add('active');
}

function closeQRSuccessModal() {
  document.getElementById('qrSuccessModal').classList.remove('active');
}

function downloadQRCode() {
  if (!currentQRDataUrl) return;
  
  const link = document.createElement('a');
  link.download = 'visitor-qr-code.png';
  link.href = currentQRDataUrl;
  link.click();
}

// Export to CSV
function exportToCSV() {
  const headers = ['ID', 'Name', 'Mobile', 'Purpose', 'Scheduled Date', 'Check-in Time', 'Check-out Time', 'Status', 'Assigned To'];
  const rows = visitors.map(v => [
    v.id,
    v.name,
    v.mobile,
    v.purpose || 'N/A',
    v.scheduledDate || 'N/A',
    v.checkInTime,
    v.checkOutTime || 'N/A',
    v.status,
    v.assignedTo || 'N/A'
  ]);
  
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'visitors_export.csv';
  link.click();
  window.URL.revokeObjectURL(url);
}

// Utility Functions
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

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Set minimum date for visit scheduling (today)
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const visitDateInput = document.getElementById('visitDate');
  if (visitDateInput) {
    visitDateInput.min = today;
  }
});