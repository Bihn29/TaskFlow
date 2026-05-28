# TaskFlow 🚀
> Real-Time Project Management Application (Trello/Notion Mini)

TaskFlow is a premium, real-time workspace and project management application built with a modern full-stack TypeScript architecture. It features drag-and-drop Kanban boards, team workspaces with granular role privileges, real-time collaboration powered by Socket.IO, nested task details, activity logs, and a clean, immersive SaaS-styled dashboard.

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework:** Next.js 14+ (App Router, React 18, TypeScript)
- **Styling:** Tailwind CSS (Vanilla styling & CSS variables)
- **State & Data Fetching:** TanStack Query v5 & Zustand
- **Forms & Validation:** React Hook Form + Zod
- **Drag & Drop:** `@dnd-kit/core` & `@dnd-kit/sortable`
- **Real-time:** `socket.io-client`
- **UI Icons:** `lucide-react`

### Backend (Server)
- **Framework:** NestJS (TypeScript, Node.js)
- **Database:** MongoDB + Mongoose (Schema validation, queries, and relations)
- **Authentication:** JWT (JSON Web Tokens) with Route Guarding
- **Real-time:** `@nestjs/platform-socket.io` & `@nestjs/websockets`
- **Validation:** `class-validator` & `class-transformer`

---

## 📁 Monorepo Structure

```
TaskFlow/
├── client/          # Next.js frontend application
├── server/          # NestJS backend application
├── package.json     # Orchestration scripts
└── README.md        # This file
```

---

## ⚙️ Quick Start Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas URI

### Installation & Launch

1. **Clone and Navigate into the Project:**
   ```bash
   cd d:\tai_lieu\NewCode
   ```

2. **Install Root Dependencies:**
   ```bash
   npm install
   ```

3. **Install Client & Server Dependencies:**
   ```bash
   npm run install:all
   ```

4. **Setup Environment Variables:**
   - Copy `server/.env.example` to `server/.env` and update details (e.g., `MONGODB_URI`, `JWT_SECRET`).
   - Copy `client/.env.local` to configure frontend environments.

5. **Start Development Servers:**
   ```bash
   npm run dev
   ```
   - Client is running at: [http://localhost:3000](http://localhost:3000)
   - Server API is running at: [http://localhost:5000](http://localhost:5000)

---

## 📋 Roadmap Phases
- **Phase 1:** Monorepo & Environment Setup (Active)
- **Phase 2:** Authentication & Users (JWT)
- **Phase 3:** Workspaces, Roles & Members
- **Phase 4:** Boards, Lists & Tasks CRUD
- **Phase 5:** Kanban Drag & Drop with `@dnd-kit`
- **Phase 6:** Comments, Assignees, Dates & Priorities
- **Phase 7:** Socket.IO Real-time Integration
- **Phase 8:** Notifications & Activity Logger
- **Phase 9:** Dashboard Polishing, States & UI transitions
- **Phase 10:** Seeding, Deployment & Documentation

---

## 🖥️ TaskFlow Desktop App (Native Electron)

TaskFlow operates as a native desktop application powered by **Electron**. It provides a premium single-window experience without showing terminal logs, starting multiple command prompts, or opening external web browsers.

### ⚙️ Desktop Prerequisites
- **MongoDB Database**: Ensure your MongoDB database is running.
  - Recommended: Configure **MongoDB Atlas** in `server/.env` for a fully portable, out-of-the-box experience.
  - Alternative (Local): Keep the local MongoDB Service running (`sc start MongoDB` or run `mongod` in a terminal).
- **Node.js**: Requires Node.js v18+.

---

### 🚀 1. Run in Development Mode

To start the integrated monorepo in development mode (which launches Next.js dev server, NestJS dev server, and Electron with live reload concurrently):
```bash
npm run dev
```

---

### 📦 2. Package Standalone Windows Executable (.exe)

To compile the entire monorepo and package it into a self-contained, standalone Windows installer `.exe`:
```bash
npm run dist
```

#### What this does under the hood:
1. Rebuilds NestJS backend server to optimized production files (`server/dist/`).
2. Rebuilds Next.js frontend client to statically optimized pages (`client/.next/`).
3. Bundles files and compiles a production-ready Windows NSIS installer using `electron-builder`.

#### Output Location:
The packaged installer will be generated under the `release/` directory:
- `release/TaskFlow Setup 1.0.0.exe` (Windows Setup Installer)
- `release/win-unpacked/` (Unpacked standalone executable folder)

---

### 🏃‍♂️ 3. Install and Launch in Production

1. Open the `release/` folder.
2. Double-click `TaskFlow Setup 1.0.0.exe` to run the custom NSIS setup window.
3. Choose your installation path, create desktop and start menu shortcuts, and complete setup.
4. Launch **TaskFlow** from your Desktop shortcut!
   - **Zero Terminal Windows**: It programmatically launches the backend NestJS and frontend Next.js servers fully hidden under the hood (`windowsHide: true`).
   - **Self-contained Window**: Loads `http://localhost:3000` automatically in a premium, customized glassmorphic BrowserWindow.
   - **Clean Teardown**: Closing the app completely terminates backend/frontend sub-processes tree-wise via native `taskkill`, releasing all ports and preventing memory leaks.

---

### 🛠️ Legacy Debug Helpers (Windows Batch)

We preserve the legacy batch scripts strictly as **debug tools** for development:
- `start-taskflow.bat`: Manually launches backend/frontend in dedicated command prompts and opens `http://localhost:3000` in your default browser.
- `stop-taskflow.bat`: Gracefully kills all running local Node.js processes.

---

### 🌐 Alternative: Install as PWA (Browser App)

1. Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge.
2. Click the **install icon** (⊕) in the address bar.
3. TaskFlow will be installed as a progressive web app running without browser tabs.

