# Mini-Jira Project Completion Checklist

> **Deadline:** May 22, 2026 at 11:59 PM  
> **Last audited:** May 21, 2026  
> Status legend: ✅ Done · ⚠️ Partial/Broken · ❌ Not started

---

## 1. Backend — Core API

### 1.1 Server & Middleware
- ✅ Express server with CORS, Morgan, JSON body parsing
- ✅ Health check endpoint (`GET /health`)
- ✅ Global error handling middleware (DynamoDB errors, 404 catch-all)
- ✅ Environment variable validation on startup (`validateEnv`)
- ❌ **`authenticateToken` middleware NOT applied to any routes** — all endpoints are fully unprotected. Must add `app.use(authenticateToken)` before route registration (or per-router) in `server.js`
- ⚠️ `node-fetch` used in `authMiddleware.js` but not listed in `package.json` — will crash on startup

### 1.2 Authentication Middleware (`authMiddleware.js`)
- ✅ `authenticateToken`: fetches Cognito JWKS, decodes JWT, attaches `req.user` (userId, email, name, role, teamId)
- ✅ Public key caching (1-hour TTL to avoid repeated JWKS fetches)
- ✅ `requireRole(...roles)` middleware — 403 if role not allowed
- ✅ `requireTeamAccess(teamIdParam)` middleware — 403 if employee accesses wrong team
- ⚠️ **`jwkToPem()` is a stub** — returns the raw JWK object instead of a PEM string. `jwt.verify()` will fail in production. Must install and use the `jwk-to-pem` npm package
- ❌ `jwk-to-pem` not in `package.json` — must `npm install jwk-to-pem`

### 1.3 DynamoDB Service (`dynamoService.js`)
- ✅ `putItem`, `getItem`, `deleteItem`, `scanTable`
- ✅ `queryByIndex` — used for GSI-based team/assignee queries
- ✅ `updateItem` with `ReturnValues: 'ALL_NEW'`
- ⚠️ `scanTable` is used for listing comments and cascading deletes — must be replaced with `queryByIndex` on production tables with >1MB of data (scan has 1MB page limit and no pagination)

### 1.4 Users API
- ✅ `GET /api/users` — list users
- ✅ `GET /api/users/:id` — get user by ID
- ✅ `POST /api/users` — create user
- ✅ `PUT /api/users/:id` — update user
- ✅ `DELETE /api/users/:id` — delete user (with validation)
- ❌ Auth middleware not applied to these routes

### 1.5 Teams API
- ✅ `GET /api/teams` — list teams
- ✅ `GET /api/teams/:id` — get team
- ✅ `POST /api/teams` — create team
- ✅ `PUT /api/teams/:id` — update team
- ✅ `DELETE /api/teams/:id` — delete team (with cascade safety check)
- ❌ Auth middleware not applied; no manager-only enforcement on POST/DELETE

### 1.6 Projects API
- ✅ `GET /api/projects` — list projects
- ✅ `GET /api/projects/:id` — get project
- ✅ `POST /api/projects` — create project
- ✅ `PUT /api/projects/:id` — update project
- ✅ `DELETE /api/projects/:id` — delete project
- ❌ Auth middleware not applied; no team-scoped filtering for employees

### 1.7 Tasks API
- ✅ `GET /api/tasks` — list tasks (with `teamId` GSI query when role is Employee)
- ✅ `GET /api/tasks/:id` — get task (team isolation 403 check)
- ✅ `POST /api/tasks` — create task (validates teamId, projectId, assigneeId relations)
- ✅ `PUT /api/tasks/:id` — update task (team isolation 403 check, role-based field control)
- ✅ `DELETE /api/tasks/:id` — delete task (manager-only; cascades delete of comments)
- ✅ Priority validation (`Low`, `Medium`, `High`, `Critical`)
- ✅ Status validation (`To Do`, `In Progress`, `Done`, `Blocked`)
- ⚠️ Spec defines statuses as `ToDo | InProgress | InReview | Done` — current code uses different values. Confirm which the team agreed on and align frontend + backend
- ✅ Cross-entity validation (assignee belongs to team, project belongs to team)
- ✅ Audit log embedded in task (`auditLog` array field updated on each change)
- ❌ Auth middleware not applied to task routes
- ❌ No dedicated `PUT /api/tasks/:id/assign` endpoint that publishes to SNS
- ❌ No `POST /api/tasks/:id/images` endpoint for S3 presigned URL

### 1.8 Comments API
- ✅ `POST /api/tasks/:taskId/comments` — nested route under tasks
- ✅ `GET /api/tasks/:taskId/comments` — get comments for a task
- ✅ `PUT /api/comments/:id` — update comment
- ✅ `DELETE /api/comments/:id` — delete comment
- ✅ Validates `taskId` exists before creating comment
- ❌ Auth middleware not applied; no team-scoped access check on comment creation

### 1.9 Activity Log (Separate DynamoDB Table)
- ⚠️ Audit entries are stored in the task's own `auditLog` array field — **not** written to the separate `ActivityLog` DynamoDB table defined in the spec
- ❌ Separate ActivityLog table write on status change is not implemented
- ❌ No `GET /api/tasks/:id/activity` endpoint to retrieve log entries
- ❌ `assignmentWorker` Lambda does not write to ActivityLog table

---

## 2. Backend — AWS Services

### 2.1 SNS / Task Assignment Notifications
- ❌ No SNS client configured in the backend
- ❌ `POST /api/tasks/:id/assign` (or task update) does not publish to SNS topic
- ❌ SNS topic (`minijira-task-assignment`) not verified as created in AWS console
- ❌ SNS email subscription for assignee notification not set up
- ❌ SNS → SQS subscription (fan-out) not configured

### 2.2 SQS
- ❌ No SQS consumer / polling logic in backend
- ❌ SQS queue (`minijira-task-assignment`) not verified as created in AWS console
- ❌ Dead-letter queue not configured

### 2.3 S3 — Image Upload
- ❌ No S3 client configured in the backend for presigned URLs
- ❌ `POST /api/tasks/:taskId/images` endpoint not implemented
- ❌ `imageUrl` is accepted as a plain string in task create/update — presigned upload flow is absent
- ❌ S3 originals bucket and resized bucket not verified as created

### 2.4 CloudWatch Metrics
- ❌ No CloudWatch client configured in the backend
- ❌ `TasksAssignedPerTeam` metric not published on task assignment
- ❌ `TasksCreatedDaily` metric not published on task creation
- ❌ `TasksClosedDaily` metric not published on task completion
- ❌ CloudWatch dashboard not created

---

## 3. Lambda Functions

### 3.1 `imageResize` Lambda
- ❌ `backend/lambda/imageResize/` directory is empty — handler not written
- ❌ S3 trigger (PUT on originals bucket) not configured
- ❌ `sharp` library not installed / layer not set up
- ❌ Output not written to resized bucket

### 3.2 `assignmentWorker` Lambda
- ❌ `backend/lambda/assignmentWorker/` directory is empty — handler not written
- ❌ SQS trigger not configured
- ❌ No ActivityLog write to DynamoDB
- ❌ No CloudWatch metric publish

### 3.3 `dailyDigest` Lambda
- ❌ `backend/lambda/dailyDigest/` directory is empty — handler not written
- ❌ EventBridge scheduled rule (9 AM daily) not configured
- ❌ No DynamoDB scan for tasks due today
- ❌ No SNS publish to digest topic

---

## 4. Frontend

> ⚠️ **The entire `frontend/src/` directory is empty.** Only empty subdirectory stubs exist (`pages/`, `components/`, `context/`, `services/`, `styles/`, `utils/`). Nothing has been built yet.

### 4.1 Project Setup
- ✅ `package.json` configured (Vite, React 18, React Router, Zustand, React Query, Tailwind, DnD)
- ❌ Vite config file (`vite.config.js`) not created
- ❌ Tailwind config (`tailwind.config.js`, `postcss.config.js`) not created
- ❌ Root `index.html` not created
- ❌ `main.jsx` entry point not created
- ❌ `App.jsx` with router not created
- ❌ `.env` file not created (needs Cognito pool ID, client ID, backend URL)

### 4.2 Auth Flow (Cognito)
- ❌ Login page (`/login`) — email + password sign-in
- ❌ Sign-up page (or invite flow)
- ❌ Cognito `amazon-cognito-identity-js` integration
- ❌ JWT token stored in localStorage / memory
- ❌ Auth context / Zustand store with user info (role, teamId)
- ❌ Axios instance with `Authorization: Bearer <token>` header injection
- ❌ 401 interceptor → redirect to `/login`
- ❌ Protected route wrapper (redirect to `/login` if unauthenticated)
- ❌ Logout (clear token, redirect to login)

### 4.3 Dashboard / Layout
- ❌ App shell: header with user info + logout, sidebar navigation
- ❌ `/dashboard` page
- ❌ Mobile-responsive layout
- ❌ Loading spinner component
- ❌ Error toast notifications
- ❌ Empty state placeholders

### 4.4 Project & Team Views
- ❌ Projects list page
- ❌ Project detail page (`/projects/:id`)
- ❌ Teams list (manager-only)
- ❌ Team detail view

### 4.5 Kanban Board
- ❌ Kanban board component with columns (`To Do`, `In Progress`, `In Review`, `Done`)
- ❌ Drag-and-drop using `react-beautiful-dnd`
- ❌ Drag triggers `PUT /api/tasks/:id` status update
- ❌ Task cards showing title, priority badge, assignee avatar, deadline
- ❌ "Add task" button (manager only)

### 4.6 Task Detail Modal / Page
- ❌ Task detail view (title, description, status, priority, deadline, assignee)
- ❌ Edit task form (manager: all fields; employee: status only)
- ❌ Image upload (presigned URL flow → S3 direct upload)
- ❌ Comments section (list + add comment)
- ❌ Activity log / audit trail display

### 4.7 Reusable UI Components
- ❌ Button, Card, Modal, Input, Select components
- ❌ Priority badge (color-coded)
- ❌ Role-aware conditional rendering (hide manager actions from employees)

---

## 5. AWS Infrastructure

> ⚠️ `infrastructure/cloudformation/` and `infrastructure/terraform/` directories are empty.

### 5.1 DynamoDB Tables (create manually or via IaC)
- ❌ `Users` table (PK: `userId`)
- ❌ `Teams` table (PK: `teamId`)
- ❌ `Projects` table (PK: `projectId`, GSI: `teamId-index`)
- ❌ `Tasks` table (PK: `taskId`, GSI1: `teamId-index`, GSI2: `assigneeId-index`)
- ❌ `Comments` table (PK: `commentId`, GSI: `taskId-index`)
- ❌ `ActivityLog` table (PK: `taskId`, SK: `timestamp`)
- ❌ All tables set to on-demand billing

### 5.2 Cognito User Pool
- ❌ User pool created
- ❌ Custom attributes: `custom:role`, `custom:teamId`
- ❌ App client created (no client secret for SPA)
- ❌ At least 5 test users created (different roles + teams)
- ❌ `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` values filled in `.env`

### 5.3 S3 Buckets
- ❌ Originals bucket created (`minijira-originals-*`)
- ❌ Resized bucket created (`minijira-resized-*`)
- ❌ CORS policy on originals bucket (allow PUT from frontend origin)
- ❌ S3 event notification → Lambda imageResize configured

### 5.4 SNS & SQS
- ❌ SNS topic `minijira-task-assignment` created
- ❌ SNS topic `minijira-daily-digest` created
- ❌ SQS queue `minijira-task-assignment` created
- ❌ SNS → SQS subscription (fan-out) created
- ❌ SNS email subscription for test assignee created + confirmed
- ❌ ARN values filled in `.env`

### 5.5 Lambda Deployments
- ❌ IAM execution roles for each Lambda (DynamoDB, S3, SNS, CloudWatch permissions)
- ❌ `imageResize` function deployed (with `sharp` layer)
- ❌ `assignmentWorker` function deployed, SQS event source mapping configured
- ❌ `dailyDigest` function deployed, EventBridge rule (cron `0 9 * * ? *`) configured

### 5.6 EC2 / Auto Scaling / ALB
- ❌ EC2 launch template created (Node.js runtime, backend code, `.env` populated)
- ❌ Auto Scaling Group with min 2 instances across 2+ AZs
- ❌ Application Load Balancer with target group pointing to port 5000
- ❌ ALB health check targeting `GET /health`
- ❌ Security groups: ALB (80/443 open), EC2 (5000 from ALB only)
- ❌ All backend `.env` vars set in EC2 user data or Parameter Store

### 5.7 CloudFront
- ❌ Distribution created
- ❌ Origin: ALB (backend API) + S3 static site (frontend build)
- ❌ Cache behavior: `/api/*` → no cache; `/*` → cache frontend assets
- ❌ Custom domain / HTTPS (optional but preferred)
- ❌ Frontend build deployed to S3 static hosting bucket

### 5.8 CloudWatch
- ❌ Log groups for backend EC2 (Morgan logs) and all 3 Lambda functions
- ❌ CloudWatch dashboard created with task metrics widgets
- ❌ Alarm on 5xx error rate from ALB
- ❌ Alarm on Lambda errors

---

## 6. Security & Correctness

- ❌ **Critical: `authenticateToken` must be applied as middleware** before all `/api/*` routes in `server.js`
- ❌ **Critical: `jwkToPem` stub must be replaced** — install `jwk-to-pem` and use it properly
- ❌ Manager-only routes (create team, create project, delete task) must use `requireRole('Manager')` middleware
- ❌ Employee cross-team isolation must be enforced via `requireTeamAccess` on all resource routes, not just in controller logic
- ⚠️ Temp testing fallback (`req.query.role`, `req.query.teamId`) must be removed before deployment
- ❌ `COMMENTS_TABLE` env var used in `taskController.js` but not declared — will be `undefined` at runtime
- ❌ Input sanitization: no XSS protection on free-text fields (title, description, comment text)

---

## 7. Build & Deployment Readiness

- ❌ `npm run build` in `frontend/` passes without errors
- ❌ `npm run lint` in `backend/` passes without errors
- ❌ `npm run lint` in `frontend/` passes without errors
- ❌ Backend starts cleanly with all env vars set (`npm start`)
- ❌ All placeholder `YOUR_ACCOUNT_ID` values in `.env.example` replaced with real AWS values on EC2
- ❌ `.env` files are in `.gitignore` (already done — verify before final push)

---

## 8. Demo & Submission Requirements

- ❌ All 5 team members can log in with different roles/teams
- ❌ Employee cannot access another team's tasks (verify 403 response)
- ❌ Manager can create tasks, assign them, see all teams
- ❌ Image upload works end-to-end (presigned URL → S3 → Lambda resize → display resized image)
- ❌ Task assignment triggers email notification to assignee
- ❌ Daily digest email sends (trigger manually via Lambda console to demo)
- ❌ CloudWatch dashboard shows metrics
- ❌ App is deployed and accessible via CloudFront URL
- ❌ Architecture diagram completed (`docs/ARCHITECTURE.md` — diagram only, no visual yet)
- ❌ Demo video recorded (show: login, role switch, kanban drag-drop, image upload, email notification, CloudWatch)
- ❌ Submission form filled

---

## Priority Order for Remaining ~24 Hours

| Priority | Item | Owner | Est. Time |
|----------|------|-------|-----------|
| 🔴 P0 | Apply `authenticateToken` to all routes in `server.js` | Person 3/4 | 15 min |
| 🔴 P0 | Fix `jwkToPem` stub — install + use `jwk-to-pem` | Person 4 | 30 min |
| 🔴 P0 | Add `node-fetch` to `package.json` (or use native fetch Node 18+) | Person 4 | 10 min |
| 🔴 P0 | Create all DynamoDB tables with correct GSIs in AWS console | Person 5 | 45 min |
| 🔴 P0 | Create Cognito user pool + 5 test users | Person 5 | 30 min |
| 🔴 P0 | Build frontend: Vite setup, routing, auth flow | Person 1 | 3 hrs |
| 🔴 P0 | Build frontend: Dashboard + Kanban board | Person 2 | 3 hrs |
| 🟠 P1 | Add SNS publish on task assignment | Person 4 | 1 hr |
| 🟠 P1 | Implement `assignmentWorker` Lambda | Person 4 | 1 hr |
| 🟠 P1 | Implement `imageResize` Lambda + S3 buckets | Person 4 | 1.5 hrs |
| 🟠 P1 | Implement `dailyDigest` Lambda + EventBridge rule | Person 4 | 1 hr |
| 🟠 P1 | EC2 Auto Scaling Group + ALB + deploy backend | Person 5 | 2 hrs |
| 🟡 P2 | S3 presigned URL endpoint (`POST /tasks/:id/images`) | Person 3/4 | 45 min |
| 🟡 P2 | CloudFront distribution + frontend static hosting | Person 5 | 1 hr |
| 🟡 P2 | CloudWatch dashboard + alarms | Person 5 | 30 min |
| 🟡 P2 | Architecture diagram | Person 5 | 30 min |
| 🟢 P3 | Remove temp query-param auth bypass from controllers | Person 3 | 20 min |
| 🟢 P3 | Fix `scanTable` → `queryByIndex` for comments list | Person 3 | 20 min |
| 🟢 P3 | Activity log writes to separate DynamoDB table | Person 3 | 30 min |
| 🟢 P3 | Demo video | Everyone | 30 min |
