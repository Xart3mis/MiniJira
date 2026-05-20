# Backend API Specification

**Base URL:** `http://localhost:5000/api/v1` (development) or deployed ALB URL (production)

**Authentication:** All endpoints require Bearer token in `Authorization` header:
```
Authorization: Bearer <jwt_from_cognito>
```

---

## User Routes

### GET /users/me
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "cognito-user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Manager|Employee",
    "teamId": "team-123"
  }
}
```

### GET /users/:userId
Get user by ID (manager only or self).

---

## Team Routes

### POST /teams
Create a new team (admin/manager only).

**Request:**
```json
{
  "name": "Frontend Team"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "teamId": "team-123",
    "name": "Frontend Team",
    "createdAt": "2026-05-20T10:00:00Z"
  }
}
```

### GET /teams
List all teams (manager sees all; employee sees own).

**Response:**
```json
{
  "success": true,
  "data": [
    { "teamId": "team-123", "name": "Frontend Team", ... },
    { "teamId": "team-456", "name": "Backend Team", ... }
  ]
}
```

### GET /teams/:teamId
Get team details (must belong to team or be manager).

### PUT /teams/:teamId
Update team (admin/manager only).

### DELETE /teams/:teamId
Delete team (admin/manager only).

---

## Project Routes

### POST /projects
Create a project (manager only).

**Request:**
```json
{
  "title": "Q2 Redesign",
  "description": "Website redesign project",
  "teamId": "team-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj-123",
    "title": "Q2 Redesign",
    "description": "...",
    "teamId": "team-123",
    "createdAt": "2026-05-20T10:00:00Z"
  }
}
```

### GET /projects
List projects (filtered by user's team; managers see all).

### GET /projects/:projectId
Get project details.

### PUT /projects/:projectId
Update project (manager only).

### DELETE /projects/:projectId
Delete project (manager only).

---

## Task Routes

### POST /tasks
Create a task (manager only).

**Request:**
```json
{
  "title": "Build login page",
  "description": "Implement auth flow",
  "priority": "High",
  "deadline": "2026-05-22T18:00:00Z",
  "assigneeId": "user-456",
  "teamId": "team-123",
  "projectId": "proj-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "task-123",
    "title": "Build login page",
    "status": "ToDo",
    "priority": "High",
    "assigneeId": "user-456",
    "teamId": "team-123",
    "projectId": "proj-123",
    "createdAt": "2026-05-20T10:00:00Z",
    "updatedAt": "2026-05-20T10:00:00Z"
  }
}
```

### GET /tasks
List tasks (employee sees own team's tasks; manager sees all; filtered server-side).

**Query params:**
```
?status=InProgress&teamId=team-123&assigneeId=user-456
```

### GET /tasks/:taskId
Get task details (verify user's team matches).

### PUT /tasks/:taskId
Update task (manager can update anything; employee can only update own task's status).

**Request (employee):**
```json
{
  "status": "InProgress"
}
```

**Request (manager):**
```json
{
  "title": "...",
  "description": "...",
  "status": "...",
  "priority": "...",
  "deadline": "...",
  "assigneeId": "..."
}
```

### DELETE /tasks/:taskId
Delete task (manager only).

### PUT /tasks/:taskId/assign
Assign task to employee (manager only).

**Request:**
```json
{
  "assigneeId": "user-456"
}
```

**Effect:**
- Updates task in DynamoDB
- Publishes event to SNS topic
- SNS fans out to email + SQS
- Worker Lambda processes assignment

---

## Comment Routes

### POST /tasks/:taskId/comments
Add comment to task (must belong to same team).

**Request:**
```json
{
  "text": "This looks good, let me review."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "task-123",
    "commentId": "comment-uuid",
    "authorId": "user-123",
    "text": "This looks good...",
    "createdAt": "2026-05-20T10:05:00Z"
  }
}
```

### GET /tasks/:taskId/comments
Get all comments on a task.

---

## Image Routes

### POST /tasks/:taskId/images
Get presigned S3 URL for uploading image (employee can upload to own team's tasks).

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/bucket/task-123/image?...",
    "key": "task-123/image-uuid"
  }
}
```

**Usage (frontend):**
```javascript
// GET presigned URL from backend
const response = await fetch('/api/v1/tasks/task-123/images', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ...' }
});
const { uploadUrl } = await response.json();

// Upload file directly to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type }
});

// Lambda automatically triggers on upload
// Backend updates task.imageUrl after resize
```

### DELETE /tasks/:taskId/images/:imageKey
Delete image (manager or assignee only).

---

## Health & Monitoring Routes

### GET /health
Health check (no auth required).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-20T10:00:00Z"
}
```

### GET /metrics
CloudWatch metrics (monitoring only).

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Missing required field: title"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Missing or invalid token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "User does not belong to this team"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "NotFound",
  "message": "Task not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "ServerError",
  "message": "Internal server error (check CloudWatch logs)"
}
```

---

## Role-Based Access Control (RBAC)

| Route | Manager | Employee | Notes |
|-------|---------|----------|-------|
| POST /tasks | ✅ | ❌ | Create tasks |
| GET /tasks | ✅ (all) | ✅ (own team) | Server-side filtering |
| PUT /tasks/:id | ✅ (all) | ✅ (status only, own team) | Limited scope for employee |
| DELETE /tasks/:id | ✅ | ❌ | Manager only |
| POST /comments | ✅ | ✅ (own team) | Team-scoped |
| POST /images | ✅ | ✅ (own team) | Team-scoped |

---

## Testing

### Test Users

In Cognito, create:
- **Manager Ali**: role=Manager, teamId=null (sees all)
- **Employee Sara**: role=Employee, teamId=team-frontend
- **Employee Omar**: role=Employee, teamId=team-backend

### Quick Test Sequence

```bash
# 1. Sign in as Manager Ali (get token)
POST /signin
body: { email: "ali@example.com", password: "..." }
# save token

# 2. Create task in Frontend team, assign to Sara
POST /tasks
auth: token
body: {
  "title": "Task A",
  "teamId": "team-frontend",
  "assigneeId": "sara-id"
}

# 3. Create task in Backend team, assign to Omar
POST /tasks
auth: token
body: {
  "title": "Task B",
  "teamId": "team-backend",
  "assigneeId": "omar-id"
}

# 4. Sign in as Employee Sara (get token)
POST /signin
body: { email: "sara@example.com", password: "..." }
# save token

# 5. List tasks (should only see Task A)
GET /tasks
auth: token
# expect: [{ title: "Task A", ... }]

# 6. Try to GET Task B directly (should fail with 403)
GET /tasks/task-b-id
auth: token
# expect: { error: "Forbidden" }
```

---

## Performance Notes

- **GSI queries** use `teamId` to filter tasks (fast)
- **Comments**: Store as SK in Tasks table or separate Comments table
- **Activity log**: Separate table for audit trail (write-intensive)
- **Presigned URLs**: Valid for 15 minutes; frontend must upload within window

---

## Lambda Async Behavior

When a task is assigned:
1. API returns immediately (200 OK)
2. SNS publishes event
3. Worker Lambda consumes from SQS (async)
4. Activity log written to DynamoDB (eventual consistency)
5. CloudWatch metric published

**Frontend**: Don't wait for activity log — it arrives asynchronously. Refresh UI after 2–3 seconds if needed.

---

## Rate Limiting

Not implemented in MVP (can add later):
- `express-rate-limit` middleware on auth routes
- Cognito rate limiting (built-in)

---

## Versioning

**Current version:** v1 (prefix: `/api/v1/`)

Future breaking changes → v2
