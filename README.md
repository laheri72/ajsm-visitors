# Visitor Management System (VMS)

A **production-ready Visitor Management System** built using **React, TypeScript, Firebase, and Firestore**.  
Designed for institutional use with **QR-based check-in**, **role-based access**, and **secure card lifecycle management**.

🔗 Live Demo: https://ajsm-vms.web.app

---

## 🚀 Features

### 👤 Guest
- Visitor self-registration
- QR code generation & download
- Scheduled date & time validation

### 🧑‍💼 Desk Operator
- QR-based visitor check-in
- RFID / Card issuance
- Real-time visitor list
- Secure check-out with lifecycle enforcement

### 🛠️ Admin
- Full visitor visibility
- Manual guest addition
- Safe visitor deletion (with checks)
- Force check-out (emergency override)
- Card management (active / available / disabled)
- Export visitors to CSV / Excel

---

## 🔐 Security & Integrity
- Firebase Authentication (role-based)
- Firestore security rules (no test mode)
- Atomic transactions for check-in / check-out
- Card lifecycle enforced at database level
- No client-side trust assumptions

---

## 🧱 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (custom theme)
- **Backend:** Firebase Authentication
- **Database:** Cloud Firestore
- **Hosting:** Firebase Hosting
- **QR Scanning:** html5-qrcode

---

## 🧠 Architecture Highlights

- Modular component-based design
- Stateless UI (Firestore as source of truth)
- Real-time updates via Firestore listeners
- Separation of concerns:
  - pages
  - services
  - hooks
  - components
- Production-grade folder structure

---

## 📂 Project Structure

```text
react-vms/
├── src/
│   ├── pages/          # Route-level screens
│   ├── components/     # Reusable UI components
│   ├── services/       # Firebase / Firestore logic
│   ├── hooks/          # Data & state hooks
│   ├── context/        # Auth & role context
│   ├── models/         # TypeScript models
│   └── utils/          # Validators & helpers
├── public/
├── index.html
└── vite.config.ts
