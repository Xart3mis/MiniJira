# Team Task Breakdown

**Deadline:** May 22, 2026 at 11:59 PM (< 48 hours)  
**Team Size:** 5 developers

---

## Person 1: Frontend Core (UI Framework & Auth)

**Focus:** Set up React foundation, auth pages, dashboard layout

### Tasks

- [ ] **Initialize React project**
  - Set up Vite + TailwindCSS + shadcn/ui OR Chakra UI
  - Configure React Router (pages: Login, Dashboard, ProjectDetail)
  - Set up Zustand or Context API for auth state
  - Create .env for Cognito config

- [ ] **Implement Cognito auth flow**
  - Sign-up page (email, password)
  - Sign-in page (email, password)
  - Sign-out / logout
  - Store JWT token in localStorage
  - Redirect unauthenticated users to /login
  - Extract role/teamId from token on login

- [ ] **Build Dashboard page layout**
  - Header with user info + logout button
  - Sidebar with navigation (Projects, Teams, Settings)
  - Main content area (will be filled by Person 2)
  - Mobile-responsive grid layout

- [ ] **Create reusable UI components**
  - Button, Card, Modal, Input, Select, Loading spinner
  - Error toast notifications
  - Empty state placeholders

- [ ] **Set up API client**
  - Axios instance with Auth header injection
  - Error interceptor for 401 → redirect to login
  - Base URL from .env

### Deliverables
- Login + Sign-up pages working
- Dashboard layout visible
- Auth state persisted across page reloads
- Ready for Person 2 to integrate task views

---

## Person 2: Frontend Features (Kanban & Task Detail)

**Focus:** Task views, Kanban board, task modal, comments UI

### Tasks

- [ ] **Build Kanban board**
  - 4 columns: To Do, In Progress, In Review, Done
  - Drag-and-drop (react-beautiful-dnd or react-dnd)
  - Task cards show: title, assignee, priority, deadline
  - Click card → opens task detail modal

- [ ] **Create task detail modal**
  - Show full task: title, description, status, priority, deadline, assignee
  - Edit button for managers (update modal)
  - Status dropdown (change on drop from Kanban)
  - Comments section below
  - File upload section

- [ ] **Implement comments UI**
  - Comment list (author, text, timestamp)
  - Add comment form
  - Submit button (calls backend API)
  - Real-time refresh (fetch every 3s or on submit)

- [ ] **Implement file upload UI**
  - File input (images only)
  - Upload button
  - Show uploaded image preview
  - Loading state during upload
  - Error toast on failure

- [ ] **Team filter & view options**
  - Team selector dropdown (if manager)
  - Status filter
  - Priority filter
  - Date range filter

### Deliverables
- Kanban board dragging works (UI only, API integration by Person 3)
- Task modal opens/closes
- Comments input renders (backend API will be integrated by Person 3)
- File upload UI complete (S3 presigned URL logic by Person 4)

---

## Person 3: Backend API (Core Routes & Activity Logging)

**Focus:** Express setup, user/team/task/project routes, DynamoDB models, activity logging

### Tasks

- [ ] **Initialize Express server**
  - Set up server.js with middleware (cors, morgan, etc.)
  - Health check endpoint (`GET /health`)
  - Error handling middleware
  - Environment variable validation

- [ ] **Create DynamoDB helper functions**
  - getUser(userId)
  - getTeam(teamId)
  - getTask(taskId)
  - getProject(projectId)
  - queryTasksByTeam(teamId)
  - queryTasksByAssignee(assigneeId)

- [ ] **Implement user routes**
  - `GET /users/me` → return current user
  - `GET /users/:userId` → return user (manager only or self)

- [ ] **Implement team routes**
  - `GET /teams` → list teams (manager sees all; employee sees own)
  - `GET /teams/:teamId` → get team details
  - `POST /teams` → create team (manager only)

- [ ] **Implement project routes**
  - `GET /projects` → list projects (filtered by user's team)
  - `GET /projects/:projectId` → get project details
  - `POST /projects` → create project (manager only)
  - `PUT /projects/:projectId` → update project
  - `DELETE /projects/:projectId` → delete project

- [ ] **Implement task routes (core)**
  - `GET /tasks` → list tasks (server-side team filtering!)
  - `GET /tasks/:taskId` → get task (verify team access)
  - `POST /tasks` → create task (manager only)
  - `PUT /tasks/:taskId` → update task (role-based)
  - `DELETE /tasks/:taskId` → delete task (manager only)

- [ ] **Implement comment routes**
  - `POST /tasks/:taskId/comments` → add comment
  - `GET /tasks/:taskId/comments` → get comments

- [ ] **Set up DynamoDB activity log**
  - Write entry when task status changes
  - Fields: taskId, timestamp, userId, action, oldStatus, newStatus
  - Integrate into PUT /tasks/:taskId update flow
  - Scan activity log for audit trail + reporting

### Deliverables
- Express server starts without errors
- All CRUD endpoints respond with correct structure
- Team isolation enforced on GET /tasks
- Activity log writes entries on task status changes
- Frontend can fetch tasks + teams via API

---

## Person 4: Backend Services (S3, SNS, Lambda, Events, Auth)

**Focus:** S3 integration, image upload, SNS/SQS publishing, Lambda integration, JWT validation

### Tasks

- [ ] **Implement Cognito JWT validation**
  - Middleware to verify JWT tokens from Cognito
  - Extract user claims (userId, role, teamId) from token
  - Return 401 if token invalid/expired
  - Return 403 if user not authorized
  - Cache public keys to avoid repeated API calls
  - Integrate into Express as global middleware

- [ ] **Implement S3 presigned URL generation**
  - `POST /tasks/:taskId/images` → return presigned upload URL
  - URL valid for 15 minutes
  - Verify user has access to task's team
  - Store image key in DynamoDB task.imageUrl

- [ ] **Set up SNS publisher**
  - Publish event when task assigned
  - Event payload: taskId, assigneeId, assignerName
  - Include retry logic + error handling

- [ ] **Implement task assignment logic**
  - `PUT /tasks/:taskId/assign` → update task + publish to SNS
  - SNS fans out to:
    - Email notification (SNS subscription)
    - SQS queue (for worker Lambda)

- [ ] **Create Lambda handler boilerplate**
  - Image resize (listens to S3 events)
  - Assignment worker (drains SQS queue)
  - Daily digest (triggered by EventBridge)
  - All handlers log to CloudWatch

- [ ] **Implement CloudWatch metrics publishing**
  - Metric: `TasksAssignedPerTeam` (dimension: teamId)
  - Metric: `TasksCreatedDaily`
  - Metric: `TasksClosedDaily` (dimension: teamId)
  - From EC2 backend + Lambda functions

### Deliverables
- JWT validation middleware working (test with Postman)
- Image upload presigned URL works
- SNS topic publishes events
- SQS queue receives messages
- Lambda functions trigger (test locally first)
- CloudWatch metrics appear in console

---

## Person 5: DevOps & Infrastructure

**Focus:** EC2 setup, ALB, CloudFront, IaC, monitoring, final deployment

### Tasks

- [ ] **Set up AWS infrastructure**
  - Create VPC + subnets (public for ALB, private for EC2)
  - Create security groups (ALB → 80/443, EC2 → 5000 from ALB)
  - Create NAT gateway for EC2 outbound traffic

- [ ] **Deploy EC2 instances**
  - Launch 2 t3.micro instances across AZs (us-east-1a, us-east-1b)
  - Create user data script to install Node + clone repo + start backend
  - Attach IAM role with DynamoDB + S3 + SNS permissions
  - Tag instances: minijira-backend-1a, minijira-backend-1b

- [ ] **Create Application Load Balancer**
  - Create ALB (internet-facing, span both AZs)
  - Create target group on port 5000
  - Register EC2 instances in target group
  - Set health check to `/health` (backend route)
  - Listener: 80 → forward to targets

- [ ] **Create Auto Scaling Group**
  - Min: 2, Max: 10, Desired: 2
  - Use ALB as target group
  - Scale on CPU utilization (> 70%)

- [ ] **Set up CloudFront**
  - Create distribution with ALB as origin
  - Cache behaviors: `/api/*` (no cache), `/static/*` (24h), default (1h)
  - Copy CloudFront domain name

- [ ] **Build frontend & deploy to S3**
  - Run `npm --prefix frontend run build` locally
  - Upload `frontend/dist/` to S3 bucket (or serve via CloudFront + origin ALB)
  - Or: Package frontend in EC2 (simpler for this deadline)

- [ ] **Create CloudWatch monitoring**
  - Dashboard: tasks created/day, tasks closed/day, avg time-to-close, EC2 CPU
  - Alarms: overdue tasks > 5, EC2 CPU > 80%, ALB unhealthy targets > 0
  - SNS notifications on alarms

- [ ] **Create architecture diagram**
  - Draw using Lucidchart / Draw.io / PowerPoint
  - Include: CloudFront, ALB, EC2 (2 AZs), DynamoDB, S3, Lambda, SNS, SQS, EventBridge
  - Save as docs/ARCHITECTURE_DIAGRAM.png

- [ ] **Test full demo scenario**
  - Manager Ali creates Task A (Frontend team, assign to Sara)
  - Manager Ali creates Task B (Backend team, assign to Omar)
  - Log in as Sara → see only Task A
  - Log in as Omar → see only Task B
  - Log in as Ali → see both + filter by team
  - Upload image to task → Lambda resizes
  - Record demo video

- [ ] **Final checklist & submission**
  - Verify all resources deployed
  - Test CloudFront URL works
  - Fill submission form
  - **IMPORTANT: STOP (don't terminate) resources after submission**

### Deliverables
- EC2 instances running backend
- ALB distributes traffic
- CloudFront serves app via public URL
- CloudWatch dashboard visible
- Architecture diagram + demo video complete
- Submission form filled

---

## Daily Standup Template

Each person reports:
1. **What did I complete?** (specific files/endpoints/features)
2. **What am I working on now?** (next task)
3. **Any blockers?** (waiting for Person X to finish Y)

**Example:**
- **Person 1 (Frontend)**: "Cognito login page done. Starting dashboard layout. Blocked on Person 4 for S3 URLs."
- **Person 3 (Backend)**: "Task CRUD routes done. Team isolation working. Starting comments."
- **Person 5 (DevOps)**: "EC2 instances up. ALB failing health checks — debugging backend health endpoint."

---

## Priority If Time Runs Short

**MVP for demo:**
1. ✅ Cognito auth (login/logout)
2. ✅ Task CRUD (create, read, update, delete)
3. ✅ Team isolation (employees can't see cross-team tasks)
4. ✅ Kanban board UI (may be static if no time for drag-drop)
5. ✅ Comment add/view
6. ✅ Image upload to S3
7. ✅ SNS notification on assignment (email)
8. ✅ EC2 + ALB deployment
9. ✅ CloudFront live URL
10. ⚠️ CloudWatch dashboard (can be minimal)
11. ⚠️ Lambda image resize (nice-to-have; file still uploads)
12. ⚠️ EventBridge daily digest (nice-to-have; manual test OK)

**If everything works → polish UI, add animations, error handling**

---

## Communication

- **Use GitHub Issues for tasks** (assign each person)
- **Use Pull Requests for review** (at least 1 approval before merge)
- **Daily standup: 15 min** (morning or agreed time)
- **Blocker escalation: Post immediately** (don't wait for standup)
- **Common blockers channel** (Slack/Discord/GChat)

---

## File Ownership

| Directory | Owner | Reviewer |
|-----------|-------|----------|
| `frontend/src/pages/` | Person 1–2 | Person 1–2 |
| `frontend/src/components/` | Person 1–2 | Person 1–2 |
| `backend/src/routes/` | Person 3–4 | Person 3 |
| `backend/src/services/` | Person 4 | Person 4 |
| `backend/lambda/` | Person 4 | Person 4 |
| `infrastructure/` | Person 5 | Person 5 |
| `docs/` | Person 5 | Everyone |

---

## Success Metrics (By May 22 11:59 PM)

- ✅ All 3 demo users (Ali, Sara, Omar) can log in
- ✅ Task isolation works (Sara only sees Frontend tasks)
- ✅ Task creation/update/delete works
- ✅ Comments work on tasks
- ✅ Image upload to S3 works
- ✅ SNS email notification on assignment received
- ✅ Backend accessible via CloudFront URL (not localhost)
- ✅ CloudWatch dashboard visible
- ✅ Demo video recorded + architecture diagram created
- ✅ Submission form filled + resources stopped (not terminated)

**Good luck! 🚀**
