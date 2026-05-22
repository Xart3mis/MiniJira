# Backend Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all remaining backend code gaps so the Express API is production-ready for demo day.

**Architecture:** Express.js on Node.js; AWS SDK v2 (aws-sdk); DynamoDB via DocumentClient; middleware chain: `authenticateToken` → `requireRole` → route handler. All fixes stay within existing file/module boundaries — no new abstractions.

**Tech Stack:** Node.js ESM, Express 4, aws-sdk v2, uuid, jwk-to-pem

---

## Scope (code-only — no AWS console work)

| # | Gap | Severity |
|---|-----|----------|
| 1 | `COMMENTS_TABLE` undeclared in `taskController.js` — runtime crash on DELETE | 🔴 Critical |
| 2 | `deleteTask` uses `scanTable` full-scan for comments — fix to `queryByIndex` | 🔴 Critical |
| 3 | `requireRole('Manager')` not on route middleware for mutating team/project/task routes | 🔴 High |
| 4 | `createComment` missing team-scope check (spec: "must belong to same team") | 🟠 High |
| 5 | `req.query.role` / `req.query.teamId` bypass in task controller (security) | 🟠 High |
| 6 | Employee can update any task field via `PUT /tasks/:id` — should be status-only | 🟠 High |
| 7 | ActivityLog table writes on status change missing | 🟡 Medium |
| 8 | `GET /api/tasks/:id/activity` endpoint missing | 🟡 Medium |
| 9 | `DYNAMODB_ACTIVITY_TABLE` not in env validation or `.env.example` | 🟡 Medium |
| 10 | CloudWatch metrics not published from backend (`TasksCreatedDaily`, `TasksAssignedPerTeam`, `TasksClosedDaily`) | 🟡 Medium |

---

## Task 1: Fix `COMMENTS_TABLE` + `scanTable` bugs in `taskController.js`

**Files:**
- Modify: `backend/src/controllers/taskController.js`

The `deleteTask` function references `COMMENTS_TABLE` which is never declared in this file, and uses `scanTable` (full table scan + filter) to find comments. Both bugs must be fixed together.

- [ ] **Step 1: Add missing `COMMENTS_TABLE` declaration**

At the top of `backend/src/controllers/taskController.js`, after the existing table constants (line 14), add:

```js
const COMMENTS_TABLE = process.env.DYNAMODB_COMMENTS_TABLE;
```

- [ ] **Step 2: Replace `scanTable + filter` with `queryByIndex` in `deleteTask`**

Replace the current comment-deletion block in `deleteTask` (currently uses `scanTable(COMMENTS_TABLE)` then `.filter`) with:

```js
const taskComments = await queryByIndex(
    COMMENTS_TABLE,
    'taskId-index',
    'taskId',
    req.params.id
);
```

Remove the old `const comments = await scanTable(COMMENTS_TABLE)` and `.filter` lines entirely.

- [ ] **Step 3: Verify `queryByIndex` is already imported**

Check the import at line 1–9 of `taskController.js` includes `queryByIndex`. It does — no import change needed.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/taskController.js
git commit -m "fix(tasks): declare COMMENTS_TABLE + use queryByIndex in deleteTask"
```

---

## Task 2: Apply `requireRole('Manager')` at route level

**Files:**
- Modify: `backend/src/routes/teamRoutes.js`
- Modify: `backend/src/routes/projectRoutes.js`
- Modify: `backend/src/routes/taskRoutes.js`

Per `docs/API.md` RBAC table and `TEAM_TASKS.md`:
- Teams: POST, PUT, DELETE → Manager only
- Projects: POST, PUT, DELETE → Manager only
- Tasks: POST, DELETE → Manager only (PUT is role-split — handled in Task 3)

`requireRole` already exists in `authMiddleware.js` and returns 403 if role doesn't match.

- [ ] **Step 1: Update `teamRoutes.js`**

```js
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
    createTeam, getTeams, getTeamById, updateTeam, deleteTeam
} from '../controllers/teamController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('Manager'), createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.put('/:id', requireRole('Manager'), updateTeam);
router.delete('/:id', requireRole('Manager'), deleteTeam);

export default router;
```

- [ ] **Step 2: Update `projectRoutes.js`**

```js
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
    createProject, getProjects, getProjectById, updateProject, deleteProject
} from '../controllers/projectController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('Manager'), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', requireRole('Manager'), updateProject);
router.delete('/:id', requireRole('Manager'), deleteProject);

export default router;
```

- [ ] **Step 3: Update `taskRoutes.js`**

```js
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
    createTask, getTasks, getTaskById, updateTask, deleteTask
} from '../controllers/taskController.js';
import {
    createComment, getCommentsByTask
} from '../controllers/commentController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('Manager'), createTask);
router.get('/', getTasks);
router.post('/:taskId/comments', createComment);
router.get('/:taskId/comments', getCommentsByTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', requireRole('Manager'), deleteTask);

export default router;
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/teamRoutes.js backend/src/routes/projectRoutes.js backend/src/routes/taskRoutes.js
git commit -m "feat(routes): requireRole(Manager) on all mutating team/project/task routes"
```

---

## Task 3: Enforce employee field restriction + remove req.query bypass in `taskController.js`

**Files:**
- Modify: `backend/src/controllers/taskController.js`

Two separate issues fixed together since they're in the same controller:

**A. Remove `req.query` bypass** — every occurrence of `req.user?.role || req.query.role` and `req.user?.teamId || req.query.teamId` must become `req.user.role` and `req.user.teamId` (no fallback — `authenticateToken` guarantees `req.user` is set).

**B. Employee field restriction** — in `updateTask`, if role is `Employee`, only allow `status` to be updated. All other fields must be ignored (use existing task values).

- [ ] **Step 1: Remove all `req.query` role/teamId fallbacks in `getTasks`**

Replace in `getTasks`:
```js
const role = req.user.role;
const teamId = req.user.teamId;
```

Remove the old `req.query.role` / `req.query.teamId` lines.

- [ ] **Step 2: Remove `req.query` fallbacks in `getTaskById`**

Replace:
```js
const role = req.user.role;
const teamId = req.user.teamId;
```

- [ ] **Step 3: Remove `req.query` fallbacks + add employee field restriction in `updateTask`**

Replace the role/teamId extraction at the top of `updateTask`:
```js
const role = req.user.role;
const requesterTeamId = req.user.teamId;
```

After extracting fields from `req.body`, add employee field restriction. If role is `Employee`, override all non-status fields back to existing task values:

```js
// Employees may only change status
const isEmployee = role === 'Employee';

const finalTitle = isEmployee ? task.title : (title ?? task.title);
const finalDescription = isEmployee ? task.description : (description ?? task.description);
const finalPriority = isEmployee ? task.priority : (priority ?? task.priority);
const finalDeadline = isEmployee ? task.deadline : (deadline ?? task.deadline);
const finalAssigneeId = isEmployee ? task.assigneeId : (assigneeId ?? task.assigneeId);
const finalAssigneeEmail = isEmployee ? task.assigneeEmail : (assigneeEmail ?? task.assigneeEmail);
const finalAssigneeName = isEmployee ? task.assigneeName : (assigneeName ?? task.assigneeName);
const finalTeamId = isEmployee ? task.teamId : (teamId ?? task.teamId);
const finalProjectId = isEmployee ? task.projectId : (projectId ?? task.projectId);
const finalImageUrl = isEmployee ? task.imageUrl : (imageUrl ?? task.imageUrl);
const finalStatus = status ?? task.status;
```

Update the `updateItem` expression values to use these `final*` variables throughout.

- [ ] **Step 4: Remove `req.query` fallbacks in `deleteTask`**

Replace:
```js
const role = req.user.role;
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/taskController.js
git commit -m "fix(tasks): remove req.query auth bypass + restrict employees to status-only updates"
```

---

## Task 4: Comment team isolation in `commentController.js`

**Files:**
- Modify: `backend/src/controllers/commentController.js`

Per `docs/API.md`: "POST /tasks/:taskId/comments — Add comment to task (must belong to same team)."

After the existing `getItem(TASKS_TABLE, { taskId })` check in `createComment`, add a team membership check:

- [ ] **Step 1: Add team isolation check in `createComment`**

After the `if (!task)` block (line ~38), add:

```js
// Employees can only comment on tasks in their own team
if (req.user.role === 'Employee' && req.user.teamId !== task.teamId) {
    return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not belong to this team'
    });
}
```

- [ ] **Step 2: Use `req.user` for authorId (remove client-supplied userId)**

Replace the `userId` / `userName` extraction to always use `req.user`:

```js
const comment = {
    commentId: uuidv4(),
    taskId,
    userId: req.user.userId,
    userName: req.user.name,
    text,
    createdAt: now,
    updatedAt: now
};
```

Remove `const { userId, userName, text } = req.body;` — keep only `const { text } = req.body;`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/commentController.js
git commit -m "fix(comments): enforce team isolation + use req.user for comment author"
```

---

## Task 5: ActivityLog table writes on status change

**Files:**
- Modify: `backend/src/controllers/taskController.js`
- Modify: `backend/src/config/env.js`
- Modify: `.env.example`

Per spec (CLAUDE.md DynamoDB Tables / ActivityLog):
- PK: `taskId`, SK: `timestamp`
- Attributes: `userId`, `action`, `oldStatus`, `newStatus`

The `cloudwatch` client is already exported from `backend/src/config/aws.js`.

- [ ] **Step 1: Add `DYNAMODB_ACTIVITY_TABLE` to env validation**

In `backend/src/config/env.js`, add `'DYNAMODB_ACTIVITY_TABLE'` to the `requiredEnvVars` array:

```js
const requiredEnvVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'DYNAMODB_USERS_TABLE',
    'DYNAMODB_TEAMS_TABLE',
    'DYNAMODB_PROJECTS_TABLE',
    'DYNAMODB_TASKS_TABLE',
    'DYNAMODB_COMMENTS_TABLE',
    'DYNAMODB_ACTIVITY_TABLE',       // ← add this
    'COGNITO_USER_POOL_ID',
    'COGNITO_REGION',
    'SNS_TASK_ASSIGNMENT_TOPIC_ARN',
    'S3_ORIGINALS_BUCKET',
    'S3_RESIZED_BUCKET',
    'BACKEND_PORT',
    'NODE_ENV'
];
```

- [ ] **Step 2: Add `DYNAMODB_ACTIVITY_TABLE` to `.env.example`**

In `.env.example`, under the DynamoDB section, add:
```
DYNAMODB_ACTIVITY_TABLE=minijira-activity-log
```

- [ ] **Step 3: Add `ACTIVITY_TABLE` constant and `writeActivityLog` helper in `taskController.js`**

At the top of `taskController.js`, after the other table constants, add:

```js
const ACTIVITY_TABLE = process.env.DYNAMODB_ACTIVITY_TABLE;
```

Then add this helper function before `createTask`:

```js
async function writeActivityLog({ taskId, userId, action, oldStatus, newStatus }) {
    try {
        await putItem(ACTIVITY_TABLE, {
            taskId,
            timestamp: new Date().toISOString(),
            userId,
            action,
            oldStatus: oldStatus || null,
            newStatus: newStatus || null
        });
    } catch (err) {
        console.error('ActivityLog write failed (non-fatal):', err.message);
    }
}
```

- [ ] **Step 4: Call `writeActivityLog` in `updateTask` on status change**

In `updateTask`, inside the `if (finalStatus && finalStatus !== task.status)` block (currently only pushes to `auditLog` array), add the `writeActivityLog` call:

```js
if (finalStatus && finalStatus !== task.status) {
    auditLog.push({
        action: `Status changed from ${task.status} to ${finalStatus}`,
        by: req.user.userId,
        at: now
    });
    await writeActivityLog({
        taskId: req.params.id,
        userId: req.user.userId,
        action: 'StatusChanged',
        oldStatus: task.status,
        newStatus: finalStatus
    });
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/taskController.js backend/src/config/env.js .env.example
git commit -m "feat(tasks): write ActivityLog entry to DynamoDB on status change"
```

---

## Task 6: `GET /api/tasks/:id/activity` endpoint

**Files:**
- Modify: `backend/src/controllers/taskController.js`
- Modify: `backend/src/routes/taskRoutes.js`

Query the `ActivityLog` table using `queryByIndex` on `taskId` (table has PK=`taskId`, so use `getItem` by PK is not right — need a query). Actually since `taskId` is the PK, use `dynamoDB.query` directly. Add a `queryByPk` helper or use `queryByIndex` on the base table.

Since `dynamoService.js` has `queryByIndex` (for GSIs) but not a direct PK query returning multiple items (because `getItem` returns one item), we need a direct `query` call. The cleanest approach: add a `queryByPk` helper in `dynamoService.js`.

- [ ] **Step 1: Add `queryByPk` to `dynamoService.js`**

```js
export async function queryByPk(tableName, pkName, pkValue) {
    const params = {
        TableName: tableName,
        KeyConditionExpression: '#pk = :pkVal',
        ExpressionAttributeNames: { '#pk': pkName },
        ExpressionAttributeValues: { ':pkVal': pkValue }
    };
    const result = await dynamoDB.query(params).promise();
    return result.Items || [];
}
```

- [ ] **Step 2: Add `getTaskActivity` export to `taskController.js`**

Import `queryByPk` at the top of `taskController.js`:

```js
import {
    putItem, getItem, deleteItem, scanTable, queryByIndex, updateItem, queryByPk
} from '../services/dynamoService.js';
```

Add the controller function:

```js
export async function getTaskActivity(req, res, next) {
    try {
        const task = await getItem(TASKS_TABLE, { taskId: req.params.id });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (req.user.role === 'Employee' && req.user.teamId !== task.teamId) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You cannot access this task'
            });
        }

        const entries = await queryByPk(ACTIVITY_TABLE, 'taskId', req.params.id);

        res.json({
            success: true,
            count: entries.length,
            data: entries
        });
    } catch (error) {
        next(error);
    }
}
```

- [ ] **Step 3: Wire route in `taskRoutes.js`**

Add the import and route to `taskRoutes.js`:

```js
import {
    createTask, getTasks, getTaskById, updateTask, deleteTask, getTaskActivity
} from '../controllers/taskController.js';
```

Add before `router.get('/:id', getTaskById)`:

```js
router.get('/:id/activity', getTaskActivity);
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/dynamoService.js backend/src/controllers/taskController.js backend/src/routes/taskRoutes.js
git commit -m "feat(tasks): GET /api/tasks/:id/activity endpoint"
```

---

## Task 7: CloudWatch metrics publishing from backend

**Files:**
- Modify: `backend/src/controllers/taskController.js`

Per `docs/ARCHITECTURE.md` and `TEAM_TASKS.md` (Person 4 scope):
- `TasksCreatedDaily` — on `createTask`
- `TasksAssignedPerTeam` (dimension: teamId) — on `createTask` and on reassign in `updateTask`
- `TasksClosedDaily` (dimension: teamId) — on `updateTask` when status changes to `Done`

`cloudwatch` is already exported from `backend/src/config/aws.js`.

- [ ] **Step 1: Import `cloudwatch` in `taskController.js`**

Update the existing import from `aws.js`:

```js
import { sns, cloudwatch } from '../config/aws.js';
```

- [ ] **Step 2: Add `publishMetric` helper function**

Add after `publishTaskAssignment` in `taskController.js`:

```js
async function publishMetric(metricName, value, dimensions = []) {
    try {
        await cloudwatch.putMetricData({
            Namespace: 'MiniJira',
            MetricData: [{
                MetricName: metricName,
                Value: value,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: dimensions
            }]
        }).promise();
    } catch (err) {
        console.error(`CloudWatch metric ${metricName} failed (non-fatal):`, err.message);
    }
}
```

- [ ] **Step 3: Publish `TasksCreatedDaily` and `TasksAssignedPerTeam` in `createTask`**

After `await publishTaskAssignment(task);` in `createTask`, add:

```js
await publishMetric('TasksCreatedDaily', 1);
await publishMetric('TasksAssignedPerTeam', 1, [
    { Name: 'TeamId', Value: task.teamId }
]);
```

- [ ] **Step 4: Publish `TasksClosedDaily` and `TasksAssignedPerTeam` (reassign) in `updateTask`**

In `updateTask`, inside the `if (finalStatus && finalStatus !== task.status)` block, after the `writeActivityLog` call, add:

```js
if (finalStatus === 'Done') {
    await publishMetric('TasksClosedDaily', 1, [
        { Name: 'TeamId', Value: finalTeamId }
    ]);
}
```

After `await publishTaskAssignment(updatedTask);` (reassign block), add:

```js
await publishMetric('TasksAssignedPerTeam', 1, [
    { Name: 'TeamId', Value: finalTeamId }
]);
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/taskController.js
git commit -m "feat(tasks): publish CloudWatch metrics TasksCreatedDaily, TasksAssignedPerTeam, TasksClosedDaily"
```

---

## Self-Review Checklist

**Spec coverage:**

| Requirement (from docs) | Covered by Task |
|-------------------------|-----------------|
| `COMMENTS_TABLE` crash fix | Task 1 |
| `scanTable` → `queryByIndex` in deleteTask | Task 1 |
| Manager-only on POST/PUT/DELETE teams, projects, tasks | Task 2 |
| `req.query` bypass removal | Task 3 |
| Employee status-only restriction | Task 3 |
| Comment team isolation | Task 4 |
| Use req.user for comment author | Task 4 |
| ActivityLog DynamoDB write on status change | Task 5 |
| `DYNAMODB_ACTIVITY_TABLE` in env | Task 5 |
| `GET /api/tasks/:id/activity` endpoint | Task 6 |
| CloudWatch metrics (3 metrics) | Task 7 |

**Placeholder scan:** No TBD, TODO, or "similar to" references found.

**Type consistency:** `queryByPk` defined in Task 6 Step 1 and imported in Task 6 Step 2. `writeActivityLog` defined in Task 5 Step 3 and called in Task 5 Step 4. `getTaskActivity` defined in Task 6 Step 2 and imported in Task 6 Step 3. All consistent.

**Not in scope (AWS console, no code changes):**
- SNS topic / SQS queue creation
- DynamoDB table creation (incl. ActivityLog)
- Lambda deployment
- EC2 / ALB / CloudFront
- Frontend
