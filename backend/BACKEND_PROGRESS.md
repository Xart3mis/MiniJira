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
- Activity Log table added/connected
- Required table relationships validated in backend logic
- Task image links stored in the Tasks table using `imageUrl`
- Task audit logs stored inside task records using `auditLog`
- Separate Activity Log writes added for task status changes

### DynamoDB Indexes
- `teamId-index` used for team-based filtering
- `assigneeId-index` planned/used for assignee-based task filtering
- `taskId-index` used for comments by task
- `taskId-index` used/planned for activity logs by task
- Team isolation supported through DynamoDB queries and backend access checks

### APIs
- User CRUD implemented
- Team CRUD implemented
- Project CRUD implemented
- Task CRUD implemented
- Comment CRUD implemented
- Nested task comment routes implemented
- Task activity route implemented/planned:
  - `GET /api/tasks/:id/activity`

### Validation
- User teamId validation
- Project teamId validation
- Task teamId/projectId/assigneeId validation
- Comment taskId validation
- Role validation
- Task priority/status validation
- Email format validation
- Duplicate email prevention
- Invalid connected IDs return clear errors instead of creating broken records

### Safe Delete Rules
- Team delete blocked if used by users/projects/tasks
- Project delete blocked if used by tasks
- User delete blocked if assigned to tasks
- Task delete cascades and deletes related comments
- Safe delete responses list related records that block deletion where applicable

### Authentication & Authorization
- `authenticateToken` middleware applied to all routes:
  - tasks
  - projects
  - teams
  - users
  - comments
- `jwkToPem` stub replaced with real `jwk-to-pem` package
- JWT verification now works
- JWKS public key cached with 1-hour TTL
- User claims extracted from token:
  - `userId`
  - `role`
  - `teamId`
- 401 returned for invalid/expired tokens
- 403 returned for unauthorized access

### Role-Based Access
- Manager/Admin access supported for management actions
- Employee access restricted to own team data
- Employees can only access/update allowed task fields
- Manager-only logic planned/applied for protected create/delete operations

### Team Isolation
- Projects: employees query via `teamId-index` GSI
- Projects: cross-team 403 enforced on `getProjectById`
- Tasks: team isolation enforced using authenticated user `teamId`
- Tasks: employees cannot access tasks outside their team
- Comments: task access checked before comment access/creation

### Activity Logs
- Status changes are added to each task’s `auditLog`
- Status changes are also written to the separate `minijira-activity-log` table
- Activity log item includes:
  - `activityId`
  - `taskId`
  - `projectId`
  - `teamId`
  - `userId`
  - `action`
  - `oldStatus`
  - `newStatus`
  - `createdAt`
- `GET /api/tasks/:id/activity` returns activity entries for a task

### SNS Notifications
- `publishTaskAssignment()` fires on task create
- `publishTaskAssignment()` fires on task reassignment
- SNS errors are non-fatal:
  - errors are logged
  - request does not fail because of SNS
- Publishes `TaskAssigned` event to `SNS_TASK_ASSIGNMENT_TOPIC_ARN`

### CloudWatch Metrics
- Metric publishing helper added
- Task creation metric added
- Task assignment metric added
- Task closed metric added when status becomes `Done`
- CloudWatch errors are non-fatal and logged only

### S3 Image Upload
- `POST /api/upload/presigned` returns presigned PUT URL
- Response includes `imageUrl` pointing to resized bucket
- Upload key format:
  - `originals/{uuid}.ext`
- Task records support storing image links through `imageUrl`

### Lambda Functions (code complete, not yet deployed)
- `imageResize`
  - Trigger: S3 upload to `originals/`
  - Resizes image to 1200×1200
  - Creates 300×300 thumbnail
  - Uses `sharp`
- `assignmentWorker`
  - Trigger: SQS/SNS
  - Writes ActivityLog to DynamoDB
  - Publishes CloudWatch metric
- `dailyDigest`
  - Trigger: EventBridge
  - Scans tasks due today/overdue
  - Publishes email via SNS

### IAM / Team AWS Access
- Limited IAM user created for project teammates
- Programmatic access keys created for local `.env` use
- Console access enabled/planned for teammates who need AWS Console access
- DynamoDB project permissions added
- Cognito permissions added/planned for Cognito setup
- SNS permissions added/planned for SNS setup
- Access is limited to project-related AWS services instead of full admin access
- `.env` values prepared for teammates
- `.gitignore` should prevent `.env` from being pushed to GitHub

---

## Still Needed

### AWS Console Setup
- Confirm all DynamoDB tables exist:
  - `minijira-users`
  - `minijira-teams`
  - `minijira-projects`
  - `minijira-tasks`
  - `minijira-comments`
  - `minijira-activity-log`
- Confirm required DynamoDB indexes are active:
  - Tasks table:
    - `teamId-index`
    - `assigneeId-index`
  - Comments table:
    - `taskId-index`
  - Activity Log table:
    - `taskId-index`
    - optional `teamId-index`
  - Projects table:
    - optional `teamId-index`
  - Users table:
    - optional `teamId-index`

### SNS / SQS Setup
- Create SNS topics:
  - task assignment topic
  - daily digest topic
- Create SQS queue for task assignment processing
- Connect SNS topic to SQS queue using SNS subscription
- Confirm IAM user has needed SNS permissions:
  - `sns:GetSMSSandboxAccountStatus`
  - `sns:ListTopics`
  - `sns:CreateTopic`
  - `sns:GetTopicAttributes`
  - `sns:SetTopicAttributes`
  - `sns:ListSubscriptions`
  - `sns:ListSubscriptionsByTopic`
  - `sns:Subscribe`
  - `sns:Unsubscribe`
  - `sns:Publish`
- Add SQS permissions if needed:
  - `sqs:CreateQueue`
  - `sqs:GetQueueUrl`
  - `sqs:GetQueueAttributes`
  - `sqs:SetQueueAttributes`
  - `sqs:SendMessage`
  - `sqs:ReceiveMessage`
  - `sqs:DeleteMessage`
  - `sqs:ListQueues`

### S3 Setup
- Create S3 bucket for original images
- Create S3 bucket for resized images
- Add S3 CORS policy
- Configure S3 trigger for `imageResize` Lambda
- Confirm IAM permissions for S3:
  - `s3:GetObject`
  - `s3:PutObject`
  - `s3:DeleteObject`
  - `s3:ListBucket`
  - `s3:GetBucketLocation`

### Cognito Setup
- Create Cognito User Pool
- Create Cognito App Client
- Configure Cognito domain if needed
- Add Cognito values to `.env`
- Confirm JWT validation works with real Cognito tokens
- Confirm IAM user has needed Cognito permissions:
  - `cognito-idp:ListUserPools`
  - `cognito-idp:CreateUserPool`
  - `cognito-idp:DescribeUserPool`
  - `cognito-idp:UpdateUserPool`
  - `cognito-idp:ListUserPoolClients`
  - `cognito-idp:CreateUserPoolClient`
  - `cognito-idp:DescribeUserPoolClient`
  - `cognito-idp:UpdateUserPoolClient`
  - `cognito-idp:ListUsers`
  - `cognito-idp:AdminGetUser`
  - `cognito-idp:AdminCreateUser`
  - `cognito-idp:AdminUpdateUserAttributes`
  - `cognito-idp:AdminDisableUser`
  - `cognito-idp:AdminEnableUser`

### Lambda Deployment
- Deploy `imageResize` Lambda
- Deploy `assignmentWorker` Lambda
- Deploy `dailyDigest` Lambda
- Create correct IAM role for each Lambda
- Install/add `sharp` layer for `imageResize`
- Configure SQS event source mapping for `assignmentWorker`
- Configure EventBridge rule for `dailyDigest`
  - cron: `0 9 * * ? *`

### Backend Code Checks
- Confirm `GET /api/tasks/:id/activity` route is registered in `taskRoutes.js`
- Confirm `writeActivityLog()` uses `activityId` as the primary key
- Confirm activity log query uses `taskId-index`, not direct primary key query
- Confirm duplicate `uuidv4` import is removed
- Confirm `ACTIVITY_TABLE` environment variable is validated
- Confirm manager-only middleware is applied to:
  - team create/delete
  - project create/delete
  - task create/delete
- Confirm team-scoped access check on comment creation
- Confirm all routes return consistent response structure:
  - `success`
  - `message`
  - `data`
  - `error` when needed

### Testing
- Test all CRUD routes in Postman after auth is enabled
- Test invalid connected IDs:
  - invalid `teamId`
  - invalid `projectId`
  - invalid `assigneeId`
  - invalid `taskId` for comments
- Test safe delete responses
- Test employee cannot access another team’s tasks/projects/comments
- Test manager can create/update/delete allowed resources
- Test task status change creates:
  - task `auditLog` entry
  - separate Activity Log table item
- Test task reassignment publishes SNS event
- Test image upload presigned URL flow
- Test Lambda image resize after deployment
- Test daily digest after EventBridge setup