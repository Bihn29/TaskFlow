# DEVELOPMENT_LOG.md

## 2026-05-28

### Electron Developer Tools Disabled (DevTools Auto-Open Commented Out)
Changed:
- **`desktop/main.js`**: Vô hiệu hóa việc tự động mở Chromium Developer Tools (DevTools) khi khởi chạy ứng dụng bằng cách comment block kiểm tra `isDev` và lệnh `mainWindow.webContents.openDevTools()`. Điều này mang lại trải nghiệm một cửa sổ ứng dụng duy nhất, sạch sẽ theo đúng yêu cầu người dùng mà vẫn giữ nguyên tham chiếu code để mở thủ công nếu cần debug sau này.

### Electron Desktop Integration — Standalone Desktop App (.exe)
Changed:
- **Electron Integration**: Converted TaskFlow from multi-terminal .bat launchers into a unified single-window Electron application.
- **`desktop/main.js`** (new): Core Electron controller that manages:
  - Custom BrowserWindow settings (1280x800, dark-theme matching background color, auto-hidden menu bar, show-on-ready-to-show to prevent early flicker).
  - Background Process Spawning: Programmatically spawns NestJS server (`node dist/main.js`) and Next.js frontend (`npm run start`) in production using `windowsHide: true` and `stdio: "ignore"` to run them completely silently under the hood.
  - Active Connection Polling: Continuously polls `http://localhost:3000` via standard Node HTTP module up to 60s, loading the URL once online to ensure no blank screens are ever shown to the user.
  - Graceful Teardown: Handles window closures and application quit events by using Windows-native `taskkill /f /t /pid` to completely clean up background process trees and prevent port-leak hangs.
- **Root `package.json`**:
  - Main entry set to `"desktop/main.js"`.
  - Added new integration dev scripts using `cross-env` and `wait-on`.
  - Integrated `electron-builder` metadata config defining stand-alone NSIS `.exe` installers with custom assets, Start Menu / Desktop shortcuts, and customizable folders.
- **`desktop/assets/icon.ico`** (new): Generated standard compliant 16x16 Windows icon.
- **`scratch/generate-icon.js`** (new): Utility script that programmatically compiles custom binary PNG streams into an `.ico` wrapper.
- **`server/tsconfig.json`**: Fixed type definitions conflict during root `node_modules` scoping by adding explicit `"typeRoots": ["./node_modules/@types"]` to keep the backend NestJS isolated from parent-level global Electron types.
- **Documentation**: Updated `README.md` and `PROJECT_CONTEXT.md` with complete installation, execution, and builder guidelines.

### Desktop Tool Support — .bat Launcher + PWA
Changed:
- **`start-taskflow.bat`** (new, project root): Windows batch launcher that:
  - Checks if MongoDB is running (service or process), warns if not
  - Opens backend in new terminal: `cd server && npm run start:dev`
  - Opens frontend in new terminal: `cd client && npm run dev`
  - Waits 8 seconds for warmup, then auto-opens `http://localhost:3000`
  - Uses `%~dp0` for relative paths — works regardless of install location
- **`stop-taskflow.bat`** (new, project root): Gracefully stops TaskFlow by:
  - Asking `Y/N` confirmation before taking action
  - Killing all `node.exe` processes with a warning about other apps
- **`client/public/manifest.json`** (new): PWA manifest with:
  - `display: standalone` — opens without browser chrome
  - `theme_color: #4f46e5` (indigo), `background_color: #090d16` (dark)
  - Icons declared using standard `icon.svg` with size `any` to prevent 404 console errors on missing PNG files.
- **`client/public/icon.svg`** (new): Lightning bolt gradient icon (indigo→purple on dark bg) matching landing page logo
- **`client/src/app/layout.tsx`**: Added `manifest`, `appleWebApp`, `mobile-web-app-capable` metadata for PWA browser install support
- **`client/next.config.ts`**: Added `devIndicators: false` to remove the Next.js "N" floating dev toolbar
- **`README.md`**: Added full "Run TaskFlow as Desktop Tool" section with desktop shortcut guide, PWA install steps, and known limitations

### Delete Workspace Feature
Changed:
- **`client/src/services/workspace.service.ts`**: Added `deleteWorkspace(workspaceId)` method calling `DELETE /api/workspaces/:workspaceId`.
- **`client/src/app/workspaces/[workspaceId]/page.tsx`**: Full update:
  - Added `useEffect` to decode JWT from `localStorage` and extract `currentUserId` (reads `payload.sub`).
  - Added `currentUserRole` memo — scans `workspace.members` to find current user's role.
  - "Xóa workspace" danger button visible **only** when `currentUserRole === 'OWNER'`. Shows role badge (OWNER/ADMIN/MEMBER) next to member count.
  - Confirm dialog (custom styled modal) shows workspace name, irreversibility warning.
  - `deleteWorkspaceMutation` (`useMutation`): calls `deleteWorkspace`, on success invalidates `['workspaces']`, removes `['workspace', workspaceId]` from cache, redirects to `/dashboard`. On 403 shows "Chỉ OWNER mới được xóa workspace." On other errors shows generic message.
  - Imported `AlertTriangle`, `Trash2` from `lucide-react`.
- Build confirmed: `✓ Compiled successfully` with zero TypeScript errors.

Backend note: `DELETE /api/workspaces/:workspaceId` was already implemented in Phase 3 (`workspaces.controller.ts` + `workspaces.service.ts`). Only the frontend was missing.

### Hydration Warning Fix — suppressHydrationWarning
Root cause:
- Browser extensions (e.g. Bitdefender, Honey, Grammarly) inject extra attributes (`__processed_*`, `bis_register=*`) directly into `<body>` before React hydrates. This causes React to report an attribute mismatch between the server-rendered HTML and the DOM it hydrates on the client.
- No actual SSR logic or app data is at fault. Verified: `new Date().getFullYear()` in footer is safe (same value on both sides). `localStorage` usage in login/register is inside event handlers on `'use client'` components — no SSR mismatch. `typeof window` guards in `api.ts` and `socket.ts` are correct.

Fix:
- Added `suppressHydrationWarning` to `<html>` and `<body>` elements in `client/src/app/layout.tsx`. This prop only suppresses warnings **one level deep** on the element it's applied to — it does not mask real hydration bugs in children components.

Files modified:
- `client/src/app/layout.tsx` — added `suppressHydrationWarning` to `<html>` and `<body>`

### Landing Page UX — Scroll Fix + Navigation Overhaul
Changed:
- **Root cause of scroll blocking fixed**: Removed `overflow-hidden` from the outer `<div>` in `client/src/app/page.tsx`, removed `h-full` from `<html>` in `layout.tsx`, split `html, body` CSS in `globals.css` to avoid height constraints that were blocking `overflow-y: auto`.
- **Sticky header added**: Header is now `sticky top-0 z-50` with glassmorphism backdrop blur. Includes: Logo → `#home`, nav links for `Tính năng` → `#features` and `Hướng dẫn` → `#demo-guide`, Đăng nhập → `/login`, Dùng thử → `/register`.
- **Section IDs corrected**: Hero has `id="home"`, Features section has `id="features"` (unchanged), "Hướng dẫn sử dụng" section renamed from `id="usage-guide"` to `id="demo-guide"`. Both sections use `scroll-mt-20` for proper header offset.
- **Hero buttons**: "Khám phá ngay" → `href="#features"`, "Xem Demo" → `href="#demo-guide"`.
- **Floating back-to-top button**: Client component, appears after scrolling 400px. Smooth scrolls back to `#home`.
- **Scroll down indicator**: Added animated chevron at the bottom of the hero section to prompt scrolling.
- **Background gradients**: Moved to `position: fixed` so they stay cosmetically in place while the page scrolls.
- **CTA row in demo guide**: Added "Bắt đầu miễn phí" → `/register` and "Đã có tài khoản" → `/login` at the bottom of the guide section.
- `/login` and `/register` logos already linked back to `/` from previous session.
- Production build confirmed: `✓ Compiled successfully` with zero errors.

Files modified:
- `client/src/app/page.tsx` — full overhaul; now a `'use client'` component with scroll state
- `client/src/app/globals.css` — split html/body rules, removed height:100%
- `client/src/app/layout.tsx` — removed `h-full` from `<html>`, removed `min-h-full` from `<body>`

### Phase 8 - Notification + Activity Log
Changed:
- Implemented NestJS `NotificationsModule` with Mongoose `NotificationSchema`, indexing, DTO validations, service, and controller endpoints (`GET /api/notifications`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:notificationId/read`).
- Implemented NestJS `ActivityLogsModule` with Mongoose `ActivityLogSchema`, indexing, service, and controller endpoints (`GET /api/boards/:boardId/activity-logs`, `GET /api/tasks/:taskId/activity-logs`). Injecting models directly to completely avoid circular dependency between tasks and activity log modules.
- Wired up activity log hooks inside `WorkspacesService` (`MEMBER_ADDED`, `MEMBER_REMOVED`, `MEMBER_ROLE_UPDATED`), `BoardsService` (`BOARD_CREATED`, `BOARD_UPDATED`, `BOARD_DELETED`), `ListsService` (`LIST_CREATED`, `LIST_UPDATED`, `LIST_DELETED`, `LIST_REORDERED`), `TasksService` (`TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`, `TASK_MOVED`), and `CommentsService` (`COMMENT_CREATED`, `COMMENT_UPDATED`, `COMMENT_DELETED`).
- Added real-time notification alerts (emitted through individual private client room `user:${userId}`) when a user is assigned to a task or a comment is posted in a task they are related to (with dynamic author filtering and assignee duplicate removal).
- Added client-side services and TypeScript definitions for notifications and activity logs.
- Created premium UI component `NotificationDropdown` displaying real-time unread counts, detailed notification list, individual mark-as-read transitions, bulk read operations, and quick board navigations.
- Created slide-over sidebar panel component `BoardActivitySidebar` displaying board timeline histories in a gorgeous scrollable feed.
- Integrated Notification dropdown and Activity sidebar panel seamlessly in Board Details header panel (`client/src/app/boards/[boardId]/page.tsx`).
- Updated frontend socket manager hook `useBoardSocket.ts` to register real-time `'notification_created'` and `'activity_created'` websocket events and invalidate TanStack Query caches instantly.
- Verified backend NestJS server and Next.js client compile perfectly in production mode with zero TypeScript errors or warnings.

Files created/modified:
- server/src/notifications/* (new)
- server/src/activity-logs/* (new)
- server/src/workspaces/workspaces.service.ts (modified)
- server/src/boards/boards.service.ts (modified)
- server/src/lists/lists.service.ts (modified)
- server/src/tasks/tasks.service.ts (modified)
- server/src/comments/comments.service.ts (modified)
- server/src/realtime/realtime.service.ts (modified)
- server/src/realtime/realtime.gateway.ts (modified)
- client/src/types/notification.ts (new)
- client/src/types/activity-log.ts (new)
- client/src/services/notification.service.ts (new)
- client/src/services/activity-log.service.ts (new)
- client/src/components/notification/NotificationDropdown.tsx (new)
- client/src/components/activity/BoardActivitySidebar.tsx (new)
- client/src/app/boards/[boardId]/page.tsx (modified)
- client/src/hooks/useBoardSocket.ts (modified)

### Phase 7 - Socket.IO Realtime Board Updates
Changed:
- Integrated RealtimeModule in CommentsModule (`server/src/comments/comments.module.ts`) enabling CommentsService to emit websocket messages.
- Updated CommentsService (`server/src/comments/comments.service.ts`) to inject RealtimeService and emit realtime events on comments CRUD:
  - `comment_created` event on new comment creation (transmitting full populated details).
  - `comment_updated` event on editing comments.
  - `comment_deleted` event on deleting comment (payload `{ commentId, taskId, boardId }`).
- Created the client-side WebSocket manager (`client/src/lib/socket.ts`) with a singleton Socket.IO instance and dynamic JWT authentication extraction.
- Developed custom React hook `useBoardSocket` (`client/src/hooks/useBoardSocket.ts`) which joins board rooms and invalidates TanStack Query caches dynamically (`tasks`, `lists`, `board`, `comments`, `task` caches).
- Integrated `useBoardSocket` on `BoardDetailPage` (`client/src/app/boards/[boardId]/page.tsx`) and styled a beautiful glassmorphic connection badge (Connected, Connecting, Offline) next to the board name.
- Verified backend NestJS compilation (`npm run build`) and frontend Next.js production packaging (`npm run build`) with zero type errors.

Files created/modified:
- server/src/comments/comments.service.ts (modified)
- server/src/comments/comments.module.ts (modified)
- client/src/lib/socket.ts (new)
- client/src/hooks/useBoardSocket.ts (new)
- client/src/app/boards/[boardId]/page.tsx (modified)
- PROJECT_CONTEXT.md (modified)
- DEVELOPMENT_LOG.md (modified)

## 2026-05-27

### Phase 6 - Task Detail Modal + Comment + Assignee + Due Date UI
Changed:
- Created Mongoose Schema `Comment` (`server/src/comments/schemas/comment.schema.ts`) and configured serialization to sanitize passwords.
- Developed DTOs with validation rules for creating/updating comments.
- Implemented `CommentsService` & `CommentsController` protecting REST routes with `JwtAuthGuard` and enforcing role-based boundaries (members write/read comments, only owners/admins or creators can update/delete comments).
- Registered `CommentsModule` in `AppModule` cleanly.
- Added type interface `Comment` in `client/src/types/comment.ts`.
- Developed `commentService` client module in `client/src/services/comment.service.ts` binding comments APIs.
- Developed rich, beautiful client component `TaskComments` (`client/src/components/task/TaskComments.tsx`) in glassmorphism dark-mode style, displaying threaded comments, formatting locale dates, and orchestrating full comments CRUD with TanStack Query.
- Developed comprehensive client overlay component `TaskDetailModal` (`client/src/components/task/TaskDetailModal.tsx`) with editable inputs for title, description, priority selecting, due dates datepicking, assignee matching and workspace member loading.
- Wired up `KanbanBoard` card click navigation to toggle `TaskDetailModal` smoothly while preserving `dnd-kit` drag thresholds.
- Created and executed automated API test suite `test-phase6-flow.js` verifying 100% clean comment flow, permission constraints, and edit/delete checks.

Files created/modified:
- server/src/comments/schemas/comment.schema.ts (new)
- server/src/comments/dto/create-comment.dto.ts (new)
- server/src/comments/dto/update-comment.dto.ts (new)
- server/src/comments/comments.service.ts (new)
- server/src/comments/comments.controller.ts (new)
- server/src/comments/comments.module.ts (new)
- server/src/app.module.ts (modified)
- client/src/types/comment.ts (new)
- client/src/services/comment.service.ts (new)
- client/src/components/task/TaskComments.tsx (new)
- client/src/components/task/TaskDetailModal.tsx (new)
- client/src/components/board/KanbanBoard.tsx (modified)
- client/src/components/board/KanbanColumn.tsx (modified)
- client/src/components/board/TaskCard.tsx (modified)
- test-phase6-flow.js (new)
- test-phase6-user-flow.js (new)
- PROJECT_CONTEXT.md (modified)
- DEVELOPMENT_LOG.md (modified)


### Phase 5 - Kanban UI + Drag & Drop
Changed:
- Designed a stunning SaaS dark mode layout for the private dashboard side of the application.
- Configured QueryProvider utilizing TanStack Query to manage frontend caching and queries state.
- Developed an API Client with Axios interceptors attaching auth tokens and handling 401 unauth redirect logic.
- Built Type definitions and clean Services layers integrating Auth, Workspaces, Boards, Lists, and Tasks operations.
- Implemented premium Login and Register forms with validation and automatic redirect and session caching.
- Created Dashboard workspaces page showing active workspace cards and modal form to create a workspace.
- Constructed WorkspaceDetail page displaying boards and modal form to create a board.
- Built Kanban Column structure displaying sortable Task Cards, renaming forms, column delete, and card creation.
- Implemented core drag-and-drop Kanban Board using dnd-kit context, integrating active sensor buffers for smooth drag clicks, and calling PATCH `/tasks/:id/move` to instantly persist reordered card indexes to local MongoDB.
- Verified Next.js compiled production bundle perfectly with 0 errors.

Files created/modified:
- client/src/types/user.ts (new)
- client/src/types/workspace.ts (new)
- client/src/types/board.ts (new)
- client/src/types/list.ts (new)
- client/src/types/task.ts (new)
- client/src/lib/api.ts (new)
- client/src/services/auth.service.ts (new)
- client/src/services/workspace.service.ts (new)
- client/src/services/board.service.ts (new)
- client/src/services/list.service.ts (new)
- client/src/services/task.service.ts (new)
- client/src/providers/query-provider.tsx (new)
- client/src/app/layout.tsx (modified)
- client/src/components/layout/Sidebar.tsx (new)
- client/src/components/layout/DashboardLayout.tsx (new)
- client/src/app/login/page.tsx (new)
- client/src/app/register/page.tsx (new)
- client/src/app/dashboard/page.tsx (new)
- client/src/app/workspaces/[workspaceId]/page.tsx (new)
- client/src/components/board/TaskCard.tsx (new)
- client/src/components/board/KanbanColumn.tsx (new)
- client/src/components/board/KanbanBoard.tsx (new)
- client/src/app/boards/[boardId]/page.tsx (new)
- PROJECT_CONTEXT.md (modified)

---

### Phase 4 - Board, List, and Task CRUD
Changed:
- Created Board Schema (`server/src/boards/schemas/board.schema.ts`), List Schema (`server/src/lists/schemas/list.schema.ts`), and Task Schema (`server/src/tasks/schemas/task.schema.ts`).
- Added DTO validation classes for creating, updating, and reordering Boards, Lists, and Tasks.
- Built `BoardsService` & `BoardsController` with workspace membership checking and cascade deleting of lists and tasks.
- Developed `ListsService` & `ListsController` supporting automatic position indexing, position shifts upon deletion, and bulk reordering of list elements.
- Implemented `TasksService` & `TasksController` managing complex card movements (same-list and cross-list position shifts), assignees mapping, and member deletion security checks.
- Created `test-api-phase4.js` automatically validating full CRUD operations, Drag & Drop move positioning shifts, member role security checks, and cascade deletions.
- Registered all modules cleanly in `AppModule`.

Files created/modified:
- server/src/boards/schemas/board.schema.ts (new)
- server/src/boards/dto/create-board.dto.ts (new)
- server/src/boards/dto/update-board.dto.ts (new)
- server/src/boards/boards.service.ts (new)
- server/src/boards/boards.controller.ts (new)
- server/src/boards/boards.module.ts (new)
- server/src/lists/schemas/list.schema.ts (new)
- server/src/lists/dto/create-list.dto.ts (new)
- server/src/lists/dto/update-list.dto.ts (new)
- server/src/lists/dto/reorder-lists.dto.ts (new)
- server/src/lists/lists.service.ts (new)
- server/src/lists/lists.controller.ts (new)
- server/src/lists/lists.module.ts (new)
- server/src/tasks/enums/task-priority.enum.ts (new)
- server/src/tasks/schemas/task.schema.ts (new)
- server/src/tasks/dto/create-task.dto.ts (new)
- server/src/tasks/dto/update-task.dto.ts (new)
- server/src/tasks/dto/move-task.dto.ts (new)
- server/src/tasks/dto/assign-task.dto.ts (new)
- server/src/tasks/tasks.service.ts (new)
- server/src/tasks/tasks.controller.ts (new)
- server/src/tasks/tasks.module.ts (new)
- server/src/app.module.ts (modified)
- test-api-phase4.js (new)

---

### Phase 3 - Workspace, Members, and Roles
Changed:
- Created Workspace Schema with support for multi-member teams and dynamic roles (OWNER, ADMIN, MEMBER).
- Built `WorkspacesService` and `WorkspacesController` providing REST endpoints for Workspace CRUD.
- Implemented email-based membership invitation flow (`POST /api/workspaces/:workspaceId/members`).
- Added workspace-specific role assignment (`PATCH /api/workspaces/:workspaceId/members/:userId/role`) and member removal (`DELETE /api/workspaces/:workspaceId/members/:userId`).
- Created a comprehensive parameter validation guard for workspace member access control.

Files created/modified:
- server/src/workspaces/schemas/workspace.schema.ts (new)
- server/src/workspaces/dto/create-workspace.dto.ts (new)
- server/src/workspaces/dto/invite-member.dto.ts (new)
- server/src/workspaces/dto/change-role.dto.ts (new)
- server/src/workspaces/enums/workspace-role.enum.ts (new)
- server/src/workspaces/workspaces.service.ts (new)
- server/src/workspaces/workspaces.controller.ts (new)
- server/src/workspaces/workspaces.module.ts (new)

---

### Phase 2 - Authentication & Users
Changed:
- Created Mongoose User Schema in `server/src/users/schemas/user.schema.ts` with explicit types and custom `toJSON.transform` to secure `passwordHash`.
- Implemented `UsersService` handling registration storage and user retrieval methods.
- Built DTOs for signup and signin body validation rules (`RegisterDto`, `LoginDto`).
- Developed custom parameter decorator `@CurrentUser()` to clean up request payload reading.
- Integrated Passport JS with `JwtStrategy` decoding bearer tokens using `JWT_SECRET`.
- Built route guard `JwtAuthGuard` protecting restricted controller handlers.
- Created `AuthService` handling password encryption using `bcryptjs` and dynamic JWT token signature.
- Exposed REST HTTP Endpoints for `/api/auth/register`, `/api/auth/login`, and `/api/auth/me`.
- Registered modules in `AppModule` and configured types resolving TS and reflection compilation errors.

Files created/modified:
- server/src/users/schemas/user.schema.ts (new)
- server/src/users/users.service.ts (new)
- server/src/users/users.module.ts (new)
- server/src/auth/dto/register.dto.ts (new)
- server/src/auth/dto/login.dto.ts (new)
- server/src/auth/strategies/jwt.strategy.ts (new)
- server/src/auth/guards/jwt-auth.guard.ts (new)
- server/src/common/decorators/current-user.decorator.ts (new)
- server/src/auth/auth.service.ts (new)
- server/src/auth/auth.controller.ts (new)
- server/src/auth/auth.module.ts (new)
- server/src/app.module.ts (modified)

Notes:
- JWT expiration is set to 7d by default.
- Global validation pipelines in `main.ts` enforce rules defined in DTOs.
- `passwordHash` is safely stripped during model serialization in Mongoose.

---

### Phase 1 - Project Setup
Changed:
- Created monorepo structure with client and server folders.
- Initialized Next.js app in client.
- Initialized NestJS app in server.
- Added basic environment files.
- Added MongoDB connection setup.

Files changed:
- client/
- server/
- server/src/app.module.ts
- server/src/database/database.module.ts
- PROJECT_CONTEXT.md

Notes:
- MongoDB URI is loaded from environment variables.
- No authentication yet.

Next:
- Implement WorkspaceModule with Owner, Admin, Member role allocations.

---

## How to Test Phase 2 Endpoints

### 1. Test Registration
- **Endpoint**: `POST http://localhost:5000/api/auth/register`
- **Body (JSON)**:
  ```json
  {
    "name": "Nguyen Van A",
    "email": "a@example.com",
    "password": "password123"
  }
  ```
- **Expectation**: `201 Created` with created user profile (no `passwordHash` present in body).

### 2. Test Login
- **Endpoint**: `POST http://localhost:5000/api/auth/login`
- **Body (JSON)**:
  ```json
  {
    "email": "a@example.com",
    "password": "password123"
  }
  ```
- **Expectation**: `201 Created` with `accessToken` and `user` profile details.

### 3. Test Retrieve Current User Profile
- **Endpoint**: `GET http://localhost:5000/api/auth/me`
- **Headers**:
  - `Authorization`: `Bearer <accessToken>`
- **Expectation**: `200 OK` with verified profile metadata.
- **Fail Check**: Call endpoint without Authorization header. Expect `401 Unauthorized` return.
