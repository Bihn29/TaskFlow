# TaskFlow 🚀

TaskFlow is a real-time project management application inspired by Trello and Notion.
It helps users manage workspaces, boards, lists, tasks, comments, assignees, deadlines, notifications, and activity logs in a clean Kanban-style interface.

## ✨ Features

* JWT authentication
* Workspace and team management
* Role-based access control: Owner, Admin, Member
* Kanban board with lists and tasks
* Drag-and-drop task movement
* Task detail modal with description, priority, deadline, assignees, and comments
* Real-time board updates with Socket.IO
* Notifications for task assignments and comments
* Activity logs for tracking project changes
* Desktop app support with Electron

## 🛠 Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* TanStack Query
* Zustand
* React Hook Form
* Zod
* dnd-kit
* Socket.IO Client

### Backend

* NestJS
* TypeScript
* MongoDB
* Mongoose
* JWT Authentication
* Socket.IO
* class-validator
* class-transformer

### Desktop

* Electron
* electron-builder

## 📁 Project Structure

```bash
TaskFlow/
├── client/          # Next.js frontend
├── server/          # NestJS backend
├── desktop/         # Electron desktop app
├── package.json     # Root scripts
└── README.md
```

## ⚙️ Requirements

Before running the project, make sure you have:

* Node.js v18 or higher
* npm
* MongoDB local database or MongoDB Atlas

## 🚀 Run in Development

Install root dependencies:

```bash
npm install
```

Install client and server dependencies:

```bash
npm run install:all
```

Start the project:

```bash
npm run dev
```

The app will run at:

```bash
Frontend: http://localhost:3000
Backend:  http://localhost:5000
```

## 🖥 Build Desktop App

TaskFlow can run as a Windows desktop application using Electron.

Build the Windows `.exe` installer:

```bash
npm run dist
```

The output will be generated in:

```bash
release/
```

Example output:

```bash
release/TaskFlow Setup 1.0.0.exe
```

After installation, TaskFlow can be opened from the desktop shortcut like a normal Windows application.

## 🗄 Database Note

You can use either local MongoDB or MongoDB Atlas.

For local MongoDB, make sure MongoDB service is running before starting the app.

For better desktop app usage, MongoDB Atlas is recommended.

## 📌 Project Status

Core features completed:

* Authentication
* Workspace management
* Board/List/Task CRUD
* Kanban drag-and-drop
* Task comments and assignees
* Real-time updates
* Notifications
* Activity logs
* Electron desktop app setup

## 👤 Author

Developed by Bihn.
