# Mini-Jira Backend Progress

## Completed

### Server Setup
- Express server configured
- CORS enabled
- Morgan logging enabled
- JSON body parsing enabled
- Health check endpoint added
- 404 handler added
- Global error handler added
- Environment variable validation added

### DynamoDB
- DynamoDB helper functions created
- Users table connected
- Teams table connected
- Projects table connected
- Tasks table connected
- Comments table connected

### APIs
- User CRUD implemented
- Team CRUD implemented
- Project CRUD implemented
- Task CRUD implemented
- Comment CRUD implemented
- Nested task comment routes implemented

### Validation
- User teamId validation
- Project teamId validation
- Task teamId/projectId/assigneeId validation
- Comment taskId validation
- Role validation
- Task priority/status validation
- Email format validation
- Duplicate email prevention

### Safe Delete Rules
- Team delete blocked if used by users/projects/tasks
- Project delete blocked if used by tasks
- User delete blocked if assigned to tasks
- Task delete cascades and deletes related comments

### Authentication & Authorization
- `authenticateToken` middleware applied to all routes (tasks, projects, teams, users, comments)
- `jwkToPem` stub replaced with real `jwk-to-pem` package (JWT verification now works)
- JWKS public key cached with 1-hour TTL

### Team Isolation
- Projects: employees query via `teamId-index` GSI; cross-team 403 enforced on `getProjectById`
- Tasks: team isolation already present; consistent with auth token `teamId`

### SNS Notifications
- `publishTaskAssignment()` fires on task create and on reassign (non-fatal — errors logged, not propagated)
- Publishes `TaskAssigned` event to `SNS_TASK_ASSIGNMENT_TOPIC_ARN`

### S3 Image Upload
- `POST /api/upload/presigned` returns presigned PUT URL + `imageUrl` pointing to resized bucket
- Upload key format: `originals/{uuid}.ext`

### Lambda Functions (code complete, not yet deployed)
- `imageResize`: S3 trigger on `originals/`; resizes to 1200×1200 and 300×300 thumbnail via sharp
- `assignmentWorker`: SQS/SNS trigger; writes ActivityLog to DynamoDB; publishes CloudWatch metric
- `dailyDigest`: EventBridge trigger; scans tasks due today/overdue; publishes email via SNS

## Still Needed

### AWS Console Setup (no code changes required)
- Create SNS topics + SQS queue + SNS→SQS subscription
- Create S3 buckets + CORS policy + S3→Lambda trigger
- Deploy all 3 Lambda functions with correct IAM roles
- Configure SQS event source mapping for `assignmentWorker`
- Configure EventBridge rule (cron `0 9 * * ? *`) for `dailyDigest`
- Install sharp layer on `imageResize` Lambda

### Backend Code Gaps
- Manager-only middleware enforcement on team/project create + delete routes
- Team-scoped access check on comment creation
- Activity log writes to separate DynamoDB table on status change
- `GET /api/tasks/:id/activity` endpoint