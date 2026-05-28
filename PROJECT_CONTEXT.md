# PROJECT_CONTEXT.md

## 1. Project Overview
Tên project:
TaskFlow

Mô tả:
TaskFlow là ứng dụng quản lý công việc realtime giống Trello/Notion mini, cho phép người dùng tạo workspace, board, list, task, comment, assign member, deadline, notification, activity log và realtime update.

---

## 2. Tech Stack
Frontend:
- Next.js (App Router, React 19, TS)
- Tailwind CSS (v4)
- TanStack Query (v5)
- dnd-kit
- socket.io-client
- Zod & React Hook Form
- Zustand

Backend:
- NestJS (v11)
- TypeScript
- MongoDB & Mongoose
- JWT
- Socket.IO

Database:
- Local MongoDB (hoặc MongoDB Atlas)

---

## 3. Current Project Status
- **Phase 1 completed**: setup monorepo with client and server folders, configured MongoDB, and setup environment variables.
- **Phase 2 completed**: AuthModule & UsersModule fully implemented. Successful email unique index checks, bcryptjs password hashing, dynamic JWT signing, and route protection using JwtAuthGuard.
- **Phase 3 completed**: Workspace + Member + Role management module fully implemented with RBAC controls and invitation system.
- **Phase 4 completed**: Board, List, and Task CRUD module fully implemented with cascade deletions, automatic list/task position reordering, assignee mappings, and Drag & Drop integration logic.
- **Phase 5 completed**: Premium frontend Kanban board UI implemented with robust drag-and-drop orchestration using dnd-kit, complete with Auth pages, Workspaces dashboard, Workspace detailed views, columns/cards inline edits, and automatic state synching.
- **Phase 6 completed**: Task Detail Modal, Comment thread CRUD, member assignee bindings, and due-dates/priority updates fully implemented in both frontend and backend with strict RBAC controls.
- **Phase 7 completed**: Socket.IO Realtime Board Updates fully implemented. Multiple users can view the same Board and experience immediate Kanban and comments synchronization using custom Socket gateways with JWT handshake verification.
- **Phase 8 completed**: Real-time Notification and Activity Log systems fully implemented. Notifications generated for task assignment/comment actions, coupled with unread counting, bulk marking as read, and user private websocket channel room broadcasts. Activity logs capture workspace timeline histories, visible in a sleek real-time slide-over board drawer sidebar.
- **Landing Page UX patched**: Fixed vertical scroll blocking caused by `overflow-hidden` on the root div and `h-full` on the `<html>` element. Added sticky header with nav links (Tính năng / Hướng dẫn), floating back-to-top button, hero `id="home"`, features `id="features"`, demo guide renamed to `id="demo-guide"`. TF logo on /login and /register links back to /.
- **Hydration warning fixed**: Added `suppressHydrationWarning` to `<html>` and `<body>` in `layout.tsx` to suppress false-positive React hydration mismatches caused by browser extensions injecting attributes (`__processed_*`, `bis_register=*`) into the DOM before React hydrates. No real SSR logic is affected.
- **Delete Workspace added**: Workspace Detail Page now shows a "Xóa workspace" danger button (OWNER only). Includes confirm dialog with workspace name, `useMutation` calling `DELETE /api/workspaces/:workspaceId`, error handling for 403/other, and redirect to `/dashboard` on success.
- **Electron Native Desktop App integrated**: Completely transitioned TaskFlow into a single-window Electron desktop app. In development, running `npm run dev` concurrently boots NestJS and Next.js and loads Electron pointing to `http://localhost:3000` (using `wait-on`). In production, running `npm run dist` packages the entire workspace into a standalone Windows installer `.exe` inside `release/`. The production app programmatically spawns NestJS (`node dist/main.js` from `server`) and Next.js (`npm run start` from `client`) fully hidden under the hood (`windowsHide: true`), polls until active, loads in a premium custom BrowserWindow (1280x800, autoHideMenuBar, show on ready-to-show), and performs a clean process tree teardown (`taskkill /f /t /pid`) on app quit.
- **Desktop Tool support (legacy)**: Legacy batch files `start-taskflow.bat` and `stop-taskflow.bat` are kept as debug helpers. Added PWA `manifest.json` pointing directly to standard `icon.svg` (sizes="any", type="image/svg+xml") to prevent 404 console errors. Updated `layout.tsx` with PWA metadata. Updated `README.md` with desktop shortcut and PWA install guide.
- **Dev servers verified**: Both NestJS and Next.js start, compile successfully, and pass all production builds without errors.

---


## 4. Project Structure
```
NewCode/
├── client/              # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── workspaces/
│   │   │   │   └── [workspaceId]/
│   │   │   │       └── page.tsx
│   │   │   ├── boards/
│   │   │   │   └── [boardId]/
│   │   │   │       └── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx # Premium landing page
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── DashboardLayout.tsx
│   │   │   ├── board/
│   │   │   │   ├── KanbanBoard.tsx
│   │   │   │   ├── KanbanColumn.tsx
│   │   │   │   └── TaskCard.tsx
│   │   │   └── task/
│   │   │       ├── TaskDetailModal.tsx
│   │   │       └── TaskComments.tsx
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── providers/
│   │   │   └── query-provider.tsx
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── workspace.service.ts
│   │   │   ├── board.service.ts
│   │   │   ├── list.service.ts
│   │   │   ├── task.service.ts
│   │   │   └── comment.service.ts
│   │   └── types/
│   │       ├── user.ts
│   │       ├── workspace.ts
│   │       ├── board.ts
│   │       ├── list.ts
│   │       ├── task.ts
│   │       └── comment.ts
├── server/              # NestJS backend
│   ├── src/
│   │   ├── common/
│   │   │   └── decorators/
│   │   │       └── current-user.decorator.ts # Custom CurrentUser parameter injector
│   │   ├── database/
│   │   │   └── database.module.ts
│   │   ├── users/
│   │   │   ├── schemas/
│   │   │   │   └── user.schema.ts            # Mongoose User model
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts           # Validation for signup
│   │   │   │   └── login.dto.ts              # Validation for signin
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts           # Passport JWT strategy
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts         # Route guard
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── workspaces/                        # Workspace management (Phase 3)
│   │   │   ├── schemas/
│   │   │   │   └── workspace.schema.ts
│   │   │   ├── workspaces.service.ts
│   │   │   └── workspaces.controller.ts
│   │   ├── boards/                            # Board CRUD (Phase 4)
│   │   │   ├── schemas/
│   │   │   │   └── board.schema.ts
│   │   │   ├── boards.service.ts
│   │   │   └── boards.controller.ts
│   │   ├── lists/                             # List CRUD & Reordering (Phase 4)
│   │   │   ├── schemas/
│   │   │   │   └── list.schema.ts
│   │   │   ├── lists.service.ts
│   │   │   └── lists.controller.ts
│   │   ├── tasks/                             # Task CRUD & Assignments (Phase 4)
│   │   │   ├── schemas/
│   │   │   │   └── task.schema.ts
│   │   │   ├── tasks.service.ts
│   │   │   └── tasks.controller.ts
│   │   ├── comments/                          # Task Comments (Phase 6)
│   │   │   ├── schemas/
│   │   │   │   └── comment.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-comment.dto.ts
│   │   │   │   └── update-comment.dto.ts
│   │   │   ├── comments.service.ts
│   │   │   ├── comments.controller.ts
│   │   │   └── comments.module.ts
│   │   ├── notifications/                     # Notifications (Phase 8)
│   │   │   ├── schemas/
│   │   │   │   └── notification.schema.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── notifications.controller.ts
│   │   │   └── notifications.module.ts
│   │   ├── activity-logs/                     # Activity Logs (Phase 8)
│   │   │   ├── schemas/
│   │   │   │   └── activity-log.schema.ts
│   │   │   ├── activity-logs.service.ts
│   │   │   ├── activity-logs.controller.ts
│   │   │   └── activity-logs.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   │   ├── package.json
│   │   └── .env
├── package.json         # Root monorepo workspace configurations
├── PROJECT_CONTEXT.md   # Project context state memory (This file)
└── README.md            # Root repository setup guide
```

---

## 5. Backend Modules
- **DatabaseModule**: Kết nối NestJS với cơ sở dữ liệu MongoDB một cách không đồng bộ thông qua Mongoose và ConfigService.
- **UsersModule**: Quản lý truy cập dữ liệu MongoDB đối với thực thể User thông qua Mongoose Model (createUser, findByEmail, findById).
- **AuthModule**: Quản lý nghiệp vụ xác thực người dùng bao gồm đăng ký tài khoản (register DTO, hashing bcrypt), đăng nhập (login DTO, comparing, JWT token signature) và xác minh quyền truy cập tài nguyên.
- **WorkspacesModule**: Quản lý workspace, phân quyền thành viên (OWNER, ADMIN, MEMBER) và mời/trục xuất thành viên khỏi Workspace.
- **BoardsModule**: Quản lý bảng công việc (Board) thuộc về các workspace, hỗ trợ bảo vệ RBAC ở mức Workspace.
- **ListsModule**: Quản lý các cột công việc (List) thuộc Board, hỗ trợ sắp xếp vị trí và dịch chuyển vị trí khi xóa.
- **TasksModule**: Quản lý các thẻ công việc (Task), hỗ trợ gán thành viên, di chuyển chéo cột, theo dõi hạn chót và RBAC cho thành viên.

---

## 6. Frontend Pages
- `/`: Trang chủ SaaS Landing Page tối hiện đại với sticky header, hero section (`id="home"`), tính năng (`id="features"`), hướng dẫn sử dụng (`id="demo-guide"`), floating back-to-top button. Scroll hoạt động bình thường.

---

## 7. Database Models

### User (users collection)
- `name`: String, required
- `email`: String, required, unique, lowercase, trimmed
- `passwordHash`: String, required
- `avatarUrl`: String, default: null

### Workspace (workspaces collection)
- `name`: String, required
- `description`: String, default: ""
- `ownerId`: Schema.Types.ObjectId ref: 'User', required
- `members`: Array of `WorkspaceMember` ({ userId, role: OWNER|ADMIN|MEMBER, joinedAt })

### Board (boards collection)
- `name`: String, required
- `description`: String, default: ""
- `workspaceId`: Schema.Types.ObjectId ref: 'Workspace', required
- `createdBy`: Schema.Types.ObjectId ref: 'User', required

### List (lists collection)
- `title`: String, required
- `boardId`: Schema.Types.ObjectId ref: 'Board', required
- `position`: Number, required (0-indexed)

### Task (tasks collection)
- `title`: String, required
- `description`: String, default: ""
- `boardId`: Schema.Types.ObjectId ref: 'Board', required
- `listId`: Schema.Types.ObjectId ref: 'List', required
- `position`: Number, required (0-indexed)
- `priority`: String enum (LOW | MEDIUM | HIGH), default: MEDIUM
- `dueDate`: Date, default: null
- `createdBy`: Schema.Types.ObjectId ref: 'User', required
- `assignees`: Array of Schema.Types.ObjectId ref: 'User', default: []

### Comment (comments collection)
- `taskId`: Schema.Types.ObjectId ref: 'Task', required
- `userId`: Schema.Types.ObjectId ref: 'User', required
- `content`: String, required
- `createdAt`: Date
- `updatedAt`: Date

### Notification (notifications collection)
- `userId`: Schema.Types.ObjectId ref: 'User', required
- `type`: String, required (e.g. TASK_ASSIGNED, TASK_COMMENTED)
- `message`: String, required
- `taskId`: Schema.Types.ObjectId ref: 'Task', optional
- `boardId`: Schema.Types.ObjectId ref: 'Board', optional
- `workspaceId`: Schema.Types.ObjectId ref: 'Workspace', optional
- `isRead`: Boolean, default: false
- `createdAt`: Date
- `updatedAt`: Date

### ActivityLog (activitylogs collection)
- `workspaceId`: Schema.Types.ObjectId ref: 'Workspace', required
- `boardId`: Schema.Types.ObjectId ref: 'Board', optional
- `taskId`: Schema.Types.ObjectId ref: 'Task', optional
- `userId`: Schema.Types.ObjectId ref: 'User', required
- `action`: String, required
- `message`: String, optional
- `metadata`: Schema.Types.Mixed, optional
- `createdAt`: Date
- `updatedAt`: Date

---

## 8. API Endpoints

### Auth Endpoints
- `POST /api/auth/register`: Đăng ký tài khoản mới. Trả về thông tin User (201 Created).
- `POST /api/auth/login`: Đăng nhập hệ thống. Trả về `accessToken` JWT và thông tin User (201 Created).
- `GET /api/auth/me`: Lấy thông tin tài khoản hiện tại từ Token. Yêu cầu tiêu đề `Authorization: Bearer <token>` (200 OK).

### Workspace Endpoints
- `POST /api/workspaces`: Tạo Workspace mới.
- `GET /api/workspaces`: Xem danh sách Workspaces của user hiện tại.
- `GET /api/workspaces/:workspaceId`: Xem chi tiết Workspace.
- `POST /api/workspaces/:workspaceId/members`: Mời thành viên bằng Email (OWNER/ADMIN).
- `PATCH /api/workspaces/:workspaceId/members/:userId/role`: Thay đổi Role của thành viên.
- `DELETE /api/workspaces/:workspaceId/members/:userId`: Trục xuất thành viên khỏi Workspace.
- `DELETE /api/workspaces/:workspaceId`: Xóa Workspace (chỉ OWNER). Backend đã có từ Phase 3.

### Board Endpoints
- `POST /api/workspaces/:workspaceId/boards`: Tạo Board mới.
- `GET /api/workspaces/:workspaceId/boards`: Xem danh sách Boards trong Workspace.
- `GET /api/boards/:boardId`: Xem chi tiết Board.
- `PATCH /api/boards/:boardId`: Cập nhật Board (OWNER/ADMIN).
- `DELETE /api/boards/:boardId`: Xóa Board (OWNER/ADMIN, Cascade delete lists/tasks).

### List Endpoints
- `POST /api/boards/:boardId/lists`: Tạo List mới.
- `GET /api/boards/:boardId/lists`: Xem danh sách Lists trong Board.
- `PATCH /api/lists/:listId`: Đổi tên/Cập nhật List.
- `DELETE /api/lists/:listId`: Xóa List (Cascade delete tasks).
- `PATCH /api/boards/:boardId/lists/reorder`: Sắp xếp hàng loạt vị trí các List.

### Task Endpoints
- `POST /api/lists/:listId/tasks`: Tạo Task mới.
- `GET /api/boards/:boardId/tasks`: Lấy toàn bộ Tasks thuộc Board.
- `GET /api/tasks/:taskId`: Xem chi tiết Task.
- `PATCH /api/tasks/:taskId`: Cập nhật tiêu đề, mô tả, độ ưu tiên, hạn chót.
- `DELETE /api/tasks/:taskId`: Xóa Task (MEMBER chỉ được tự xóa Task do mình tạo).
- `PATCH /api/tasks/:taskId/move`: Di chuyển vị trí chéo cột/cùng cột.
- `POST /api/tasks/:taskId/assignees`: Gán thành viên vào Task (OWNER/ADMIN).
- `DELETE /api/tasks/:taskId/assignees/:userId`: Loại bỏ thành viên khỏi Task (OWNER/ADMIN).

### Comment Endpoints (Phase 6)
- `POST /api/tasks/:taskId/comments`: Viết bình luận mới dưới Task (Mọi thành viên).
- `GET /api/tasks/:taskId/comments`: Lấy danh sách bình luận của Task.
- `PATCH /api/comments/:commentId`: Chỉnh sửa bình luận (Chỉ chủ comment).
- `DELETE /api/comments/:commentId`: Xóa bình luận (Chủ comment hoặc OWNER/ADMIN).

### Notification Endpoints (Phase 8)
- `GET /api/notifications`: Lấy danh sách thông báo của người dùng hiện tại.
- `PATCH /api/notifications/read-all`: Đánh dấu tất cả thông báo của người dùng hiện tại là đã đọc.
- `PATCH /api/notifications/:notificationId/read`: Đánh dấu một thông báo cụ thể là đã đọc.

### Activity Log Endpoints (Phase 8)
- `GET /api/boards/:boardId/activity-logs`: Lấy danh sách hoạt động của một Board.
- `GET /api/tasks/:taskId/activity-logs`: Lấy danh sách hoạt động của một Task.

---

## 9. Authentication & Authorization
- **Đăng ký tài khoản**: Xác thực đầu vào (DTO). Kiểm tra xung đột Email. Mã hóa mật khẩu bằng `bcryptjs` với độ muối 10. Lưu đối tượng User mới.
- **Đăng nhập**: Tìm user theo email. Đối sánh mã băm mật khẩu bằng `bcryptjs`. Phát hành JWT Access Token chứa payload `{ sub: userId, email: user.email }`.
- **Bảo vệ route**: Sử dụng `JwtAuthGuard` thừa kế từ Passport `jwt` strategy. Trích xuất thông tin Bearer Token tự động từ HTTP Authorization header.
- **Param Decorator**: `@CurrentUser()` trích xuất trực tiếp thông tin từ `request.user` sang tham số hàm điều hướng điều khiển (clean code).

---

## 10. Realtime Events

TaskFlow integrates real-time collaboration using Socket.IO. Clients authenticate during connection handshake and subscribe to specific board rooms using the room format `board:{boardId}`.

### WebSocket Handshake Auth
- **Transport**: Socket.IO
- **Credentials**: Passed via `client.handshake.auth.token` (fallback: `Authorization` headers).
- **Security**: Validated using standard NestJS `JwtService` and `JWT_SECRET`. Authenticated users are cached under `socket.data.user`.

### Client Events (Subscribed Messages)
- `join_board` (Payload: `{ boardId }`): Socket joins the `board:{boardId}` room, allowing it to receive board-level broadcasts. Returns `board_joined` acknowledgment event.
- `leave_board` (Payload: `{ boardId }`): Socket leaves the `board:{boardId}` room. Returns `board_left` acknowledgment event.

### Server Events (Broadcast to `board:{boardId}` Room)
- **Task Events**:
  - `task_created`: Broadcasts task details upon card creation.
  - `task_updated`: Broadcasts updated task details on modification (assignee, priority, dates).
  - `task_deleted`: Broadcasts `{ taskId, boardId }` upon card removal.
  - `task_moved`: Broadcasts updated task details when dragged and dropped.
- **List Events**:
  - `list_created`: Broadcasts list details on new column creation.
  - `list_updated`: Broadcasts list details on renaming.
  - `list_deleted`: Broadcasts `{ listId, boardId }` on column deletion.
  - `lists_reordered`: Broadcasts `{ boardId }` on bulk reordering columns.
- **Board Events**:
  - `board_updated`: Broadcasts updated board details.
- **Comment Events**:
  - `comment_created`: Broadcasts comment details when added to a task.
  - `comment_updated`: Broadcasts updated comment details on modification.
  - `comment_deleted`: Broadcasts `{ commentId, taskId, boardId }` upon comment removal.
- **Notification & Activity Events**:
  - `notification_created` (Emitted privately to user's room `user:${userId}`): Emitted when user gets assigned to a task or a comment is posted in a task they are related to.
  - `activity_created` (Broadcast to `board:${boardId}`): Broadcasts new activity logs whenever any workspace, board, list, or task mutation occurs.

---

## 11. Environment Variables

### server/.env
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=super-secret-jwt-key-taskflow-2026
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### client/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 12. Dependencies

### Backend (server/package.json):
- `@nestjs/common`, `@nestjs/core`, `@nestjs/config`
- `@nestjs/mongoose`, `mongoose`
- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
- `@nestjs/websockets`, `@nestjs/platform-socket.io`
- `class-validator`, `class-transformer`
- `bcryptjs`
- `@types/bcryptjs`, `@types/passport-jwt` (dev)

### Frontend (client/package.json):
- `next`, `react`, `react-dom`
- `@tanstack/react-query`
- `axios`
- `lucide-react`
- `zod`, `react-hook-form`, `@hookform/resolvers`
- `zustand`
- `socket.io-client`
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `clsx`, `tailwind-merge`

---

## 13. Important Decisions
- Sử dụng cấu trúc monorepo gọn nhẹ, chạy song song frontend/backend thông qua `concurrently` ở thư mục gốc giúp lập trình viên thao tác nhanh chóng bằng lệnh duy nhất.
- Bổ sung cấu hình `--legacy-peer-deps` để giải quyết xung đột của gói `@nestjs/config` trên NestJS v11 mới nhất.
- Phát triển giao diện sử dụng Tailwind CSS v4, tối ưu hóa CSS Variables tự nhiên và định nghĩa các chuyển động micro-interaction mượt mà.
- Ẩn vĩnh viễn mật khẩu băm `passwordHash` ở tầng Mongoose Schema thông qua tính năng `toJSON.transform` để ngăn chặn lộ lọt thông tin an ninh kể cả khi quên lọc thủ công trong controller.
- Thêm tường minh `@Prop({ type: String })` cho các thuộc tính nullable (`string | null`) để vượt qua các hạn chế phản chiếu siêu dữ liệu (`reflect-metadata`) của NestJS.

---

## 14. Known Issues
- Không có. (Dự án khởi động mượt mà, kết nối DB thành công và biên dịch sạch sẽ không cảnh báo).

---

## 15. Next Steps
1. Phát triển thống kê báo cáo công việc (Phase 9).

---

## 16. Change Log

### 2026-05-28
- **Tắt DevTools tự động mở**:
  - Vô hiệu hóa việc tự động mở Chromium Developer Tools (DevTools) khi khởi chạy ứng dụng Electron trong file `desktop/main.js` để mang lại giao diện ứng dụng duy nhất, sạch sẽ theo đúng yêu cầu người dùng.
- **Phase 8 Complete**:
  - Triển khai thành công hệ thống Notification & Activity Log tích hợp realtime Socket.IO.
  - Xây dựng module Notifications lưu trữ thông báo khi user được assign vào task hoặc nhận comment mới trên task liên quan (bỏ qua chính người gửi và loại bỏ trùng lặp).
  - Triển khai REST endpoints và private websocket channels cho notifications, tự động cập nhật số lượng thông báo chưa đọc (unread badge) trên header.
  - Thiết lập module Activity Log ghi nhận đầy đủ lịch sử hoạt động của Workspace, Board, List, Task, Comment theo dòng thời gian timeline và hiển thị thông qua Slide-over board drawer sidebar ở frontend.
  - Đăng ký và lắng nghe thành công các sự kiện `'notification_created'` và `'activity_created'` trong `useBoardSocket` hook để tự động invalidate query qua TanStack Query giúp đồng bộ dữ liệu tức thời.
  - Khắc phục triệt để lỗi TypeScript trong `toJSON.transform` của các schema mới, đảm bảo cả frontend và backend đều compile thành công 100%.
- **Phase 7 Complete**:
  - Tích hợp thành công Socket.IO Realtime Board Updates trên cả server NestJS và client Next.js.
  - Cấu hình backend CommentsService gọi RealtimeService phát các sự kiện CRUD comment (`comment_created`, `comment_updated`, `comment_deleted`) tới room của board.
  - Xây dựng mô-đun client `client/src/lib/socket.ts` quản lý kết nối socket đơn (singleton) và cập nhật token JWT động từ localStorage.
  - Xây dựng React hook `useBoardSocket` tự động join/leave board room và kích hoạt tự làm mới dữ liệu thông qua TanStack Query invalidation cho các query `tasks`, `lists`, `board`, `comments`, và `task`.
  - Tích hợp badge hiển thị trạng thái kết nối realtime (Connected / Connecting / Offline) cực kỳ trực quan và sinh động trên Board header.
  - Xác thực toàn bộ ứng dụng biên dịch thành công 100% không cảnh báo hay lỗi kiểu TypeScript.

### 2026-05-27
- **Phase 6 Complete**:
  - Triển khai Comments module ở backend NestJS bảo vệ bởi JwtAuthGuard. Phân quyền thành viên đọc/ghi, OWNER/ADMIN và chủ comment xóa/chỉnh sửa.
  - Tích hợp thành công frontend Task Detail Modal hiển thị chi tiết task, cho phép lưu title, description, priority và due date.
  - Xây dựng chức năng Assignee gán/loại bỏ thành viên trực quan, tự động đồng bộ hóa sang Kanban board.
  - Xây dựng component TaskComments hiển thị thread bình luận, hỗ trợ thêm/sửa/xóa trực quan kèm theo TanStack Query invalidations.
  - Viết kịch bản kiểm thử tích hợp tự động `test-phase6-flow.js` và xác thực thành công 100%.
- **Phase 5 Complete**:
  - Triển khai giao diện Kanban board trực quan đẹp mắt (SaaS Dark mode style) hỗ trợ kéo thả thẻ công việc mượt mà sử dụng dnd-kit.
  - Tích hợp và lưu trữ trạng thái kéo thả công việc tự động qua API di chuyển thẻ (`PATCH /tasks/:id/move`).
  - Viết đầy đủ dịch vụ tích hợp API và phân tách kiểu dữ liệu (TypeScript Types).
  - Hoàn tất các biểu mẫu xác thực, tạo workspace, tạo bảng, đổi tên danh sách, và chỉnh sửa/xóa thẻ công việc nhanh chóng trực tiếp trên UI.
- **Phase 4 Complete**:
  - Triển khai Board, List, Task CRUD đầy đủ kèm theo cascade deletion và tự động điều chỉnh position khi xóa/di chuyển.
  - Hỗ trợ phân quyền chặt chẽ theo Workspace Role (Member chỉ được tự xóa Task mình tạo, Admin/Owner được xóa mọi thứ, đổi vị trí...).
  - Thiết kế và hoàn tất kịch bản kiểm thử tích hợp tự động toàn diện `test-api-phase4.js`.
- **Phase 3 Complete**:
  - Triển khai WorkspaceModule hỗ trợ tạo workspace, xem chi tiết, mời thành viên, thay đổi role và trục xuất thành viên.
- **Phase 2 Complete**:
  - Tạo cấu trúc schemas và module `UsersModule` cho tài khoản.
  - Viết logic băm mật khẩu `bcryptjs` và cơ chế lọc dữ liệu nhạy cảm.
  - Tạo `AuthModule` có đầy đủ DTO validator (`RegisterDto`, `LoginDto`), JWT Passport Strategy (`JwtStrategy`), Guard xác thực (`JwtAuthGuard`), tham số tiêm (@CurrentUser).
  - Tích hợp thành công `UsersModule` and `AuthModule` vào dự án chính `AppModule`.
- **Phase 1 Complete**:
  - Khởi tạo cấu trúc monorepo gồm client (Next.js) và server (NestJS).
  - Cài đặt toàn bộ dependencies bắt buộc ở cả hai phía frontend/backend.
  - Cấu hình database kết nối MongoDB Mongoose sử dụng biến môi trường động.
  - Viết trang Landing Page tối tối hiện đại, tinh chỉnh các hiệu ứng micro-animations.
  - Xác thực thành công quá trình biên dịch và chạy song song cả hai phía client/server.
