# 🎟️ AccessGate — Event Ticketing & Verification System

AccessGate is a modern, secure event ticketing platform built with **Next.js** (App Router).

> Note: This repository implements the API using Next.js route handlers (`app/api/*`) rather than a separate Express server. This keeps the frontend and backend in a single deployable Next.js application (recommended for fast demos and Vercel deployments).

---

## 🚀 Key Features

### 🎫 Ticketing
- Create & manage events and ticket types  
- Generate unique ticket codes / QR images per ticket  
- Secure ticket validation & single check-in prevention

### 🔐 Authentication & Security
- JWT-based authentication (access + refresh tokens)  
- Role-based authorization (Admin, Organizer, Vendor, Attendee)  
- Strong validation using **Zod** + **React Hook Form**  
- Password hashing (bcrypt / argon2 recommended)

### 📱 Check-in & Analytics
- Gate validation endpoint (QR/token validation)  
- Mark check-in and record audit logs  
- Dashboard with live check-in counts and simple analytics

### 🛠 Admin Tools
- Event creation & management UI  
- Ticket issuance & list view  
- Gate validation page for scanning / pasting tokens

---

## 🧩 Tech Stack

**Frontend & Backend**
- Next.js (App Router, TypeScript) — frontend + API route handlers (`app/api`)  
- Material UI v5 (MUI) for UI components & icons  
- React Hook Form + Zod for form validation  
- Redux Toolkit + RTK Query (optional, for client-side state & API cache)  
- react-hot-toast for notifications

**Backend / Persistence**
- MongoDB Atlas (cloud) + Mongoose (models & queries)  
- JWT, bcrypt for auth & password hashing

**Dev / Deploy**
- Local dev: `npm run dev` (Next.js dev server)  
- Recommended deploy: Vercel (Next.js) + MongoDB Atlas (production DB)

---

## 📁 Project Structure (recommended)

accessgate/
├── app/ # Next.js App Router pages + UI
│ ├── api/ # Next.js Route Handlers (backend)
│ │ ├── v1/
│ │ │ ├── auth/ # sign up / login / refresh
│ │ │ ├── events/ # create event, list events
│ │ │ ├── tickets/ # create ticket, validate token
│ │ │ └── stats/ # check-in metrics
│ ├── merchant/ # merchant UI routes
│ ├── admin/ # admin / organizer UI
│ └── gate/ # gate validation UI
├── src/
│ ├── lib/ # shared helpers (mongo connection, token service)
│ ├── models/ # Mongoose models (Event, Ticket, Checkin, User)
│ ├── validators/ # Zod schemas shared between client/server
│ └── components/ # React components (MUI)
├── public/ # static assets (sample QR image, logo)
├── .env.example
├── package.json
└── README.md



> Notes:
> - Keep server-side logic inside `app/api` route handlers for Vercel compatibility.
> - If you prefer a separate backend later, the same Express + Mongoose code can be migrated to a `/server` folder.

---

## 🔧 Prerequisites

- Node.js >= 18 LTS  
- npm or pnpm  
- MongoDB Atlas account (or local MongoDB / Docker)

---

## 🛠 Installation & Local Setup

### 1. Clone the repo
git clone https://github.com/azeezwaris17/access-gate.git
cd access-gate
2. Install dependencies

npm install
3. Create environment variables
Create a .env.local file in the project root (Next reads .env.local automatically):

env
Copy code
# MongoDB
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xyz.mongodb.net/accessgate?retryWrites=true&w=majority"

# JWT
JWT_SECRET="replace_with_a_strong_secret"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# App
NEXT_PUBLIC_APP_NAME="AccessGate"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api/v1"

# Admin API key (optional)
ADMIN_API_KEY="replace_with_admin_api_key"
Tip: For local development you can use a free MongoDB Atlas cluster. See Atlas quick start.

4. Seed or create test data (optional)
If you have a scripts/seed.ts or similar, run:
npm run seed

5. Run the app

npm run dev
# open http://localhost:3000
🔌 API Endpoints (high level)
All routes are under /api/v1/* as Next.js route handlers (see app/api/v1/*)

Auth

POST /api/v1/auth/signup — register

POST /api/v1/auth/login — authenticate & return tokens

POST /api/v1/auth/refresh — refresh access token

Events & Tickets

POST /api/v1/events — create event (admin/organizer)

GET /api/v1/events — list events

POST /api/v1/events/:eventId/tickets — issue a ticket (returns ticket token & QR)

GET /api/v1/tickets/validate?token=... — validate token & mark check-in

Stats

GET /api/v1/events/:eventId/stats — check-in counts & summary

Each endpoint returns structured JSON with HTTP status codes. Authorization is required where appropriate (use Authorization: Bearer <token>).

✅ How the Ticket Token Works (summary)
Each ticket token is generated as BASE64URL(HMAC_SHA256(UUID, SERVER_SECRET) + ":" + UUID) to prevent predictability.

On validation the server:

Verifies the HMAC vs SERVER_SECRET

Looks up the ticket by UUID

Checks checkedIn state to prevent duplicates

Marks check-in and returns a PASS result or appropriate error

Security note: For production, keep SERVER_SECRET in a secure secrets manager and consider HSM signing or short-lived tokens.

🧪 Testing
Unit tests (Jest) for token generation and validation logic

Integration tests (supertest) for core API behaviour (issue ticket → validate ticket)

Run tests:
npm test

📬 Postman / API collection
A Postman collection for quick testing is included at:
/docs/AccessGate.postman_collection.json
Import into Postman / Insomnia to test flows: create event → issue ticket → validate token.

📝 Contributing

📄 License
This project is released under the MIT License. 

📬 Contact
Azeez Waris
Email: azeezwaris17@gmail.com
GitHub: https://github.com/azeezwaris17