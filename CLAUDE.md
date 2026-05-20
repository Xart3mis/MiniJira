# Mini-Jira on AWS — Project Context

**Project:** Mini-Jira task management system on AWS  
**Deadline:** May 22, 2026 at 11:59 PM (< 48 hours)  
**Team Size:** 5 developers  
**Stack:** React (frontend) + Express.js (backend) + DynamoDB + AWS services  

## Why MERN Over MEAN?

- **React > AngularJS**: Faster component iteration, larger ecosystem, easier for 5 devs to onboard
- **Mongoose → DynamoDB**: Direct AWS integration for Lambda, better serverless patterns
- **Faster development**: Pre-built UI libraries (Tailwind + shadcn/ui, Chakra), quicker prototyping

## Architecture Decision

**Monorepo structure** (`frontend/` + `backend/` at root) chosen for:
- Shared types/constants between frontend and backend
- Easy to spin up both with one `npm run dev`
- Clearer dependency management

## Critical Requirements

### Team Isolation (Server-Side Enforcement)
- **Every API endpoint must validate that the requesting user's team matches the resource's team**
- Use DynamoDB GSI on `teamId` to filter queries
- Managers bypass this; employees cannot see cross-team tasks by ID guessing
- Enforce in middleware, not just UI

### Authentication
- AWS Cognito user pool stores `role` and `teamId` as custom attributes
- Validate JWT token on every request
- Extract user context from token, pass through request pipeline

### Event-Driven Architecture
- SNS topic on task assignment → fans out to:
  1. Email notification to assignee (SNS subscription)
  2. SQS queue for async worker Lambda (writes activity log, publishes metrics)
- EventBridge scheduled rule at 9 AM → triggers Lambda for daily digest email

### High Availability
- EC2 Auto Scaling Group across 2+ Availability Zones
- Application Load Balancer with health checks
- CloudFront in front for CDN caching
- DynamoDB: on-demand billing (no capacity planning needed)

## Tech Stack Details

### Frontend (React + Vite)
```
- React 18 with Hooks
- Vite for fast dev server
- TailwindCSS + shadcn/ui OR Chakra UI (pick one)
- React Query for server state
- React Router for navigation
- Zustand or Context API for auth state
- Axios for HTTP client
```

### Backend (Express.js + Node.js)
```
- Express.js
- AWS SDK v3 (DynamoDB, S3, SNS, SQS, Cognito)
- jsonwebtoken for JWT validation
- dotenv for config
- Morgan for logging
- Cors enabled for frontend origin
```

### DynamoDB Tables

#### Users
- PK: `userId` (from Cognito)
- Attributes: `email`, `name`, `role` (Manager|Employee), `teamId`, `createdAt`

#### Teams
- PK: `teamId`
- Attributes: `name`, `createdAt`

#### Projects
- PK: `projectId`
- SK: `createdAt`
- GSI: `teamId` (partition key)
- Attributes: `title`, `description`, `teamId`

#### Tasks
- PK: `taskId`
- SK: `createdAt`
- GSI1: `teamId` (partition key) — for team-scoped queries
- GSI2: `assigneeId` (partition key) — for employee's tasks
- Attributes: `title`, `description`, `status` (ToDo|InProgress|InReview|Done), `priority`, `deadline`, `assigneeId`, `teamId`, `projectId`, `imageUrl`, `createdAt`, `updatedAt`

#### Comments
- PK: `taskId`
- SK: `commentId` (sortable by timestamp)
- Attributes: `authorId`, `text`, `createdAt`

#### ActivityLog
- PK: `taskId`
- SK: `timestamp`
- Attributes: `userId`, `action` (status change), `oldStatus`, `newStatus`

### AWS Lambda Functions

#### imageResize
- Trigger: S3 PUT on originals bucket
- Action: Resize image, write to resized bucket
- Runtime: Node.js with sharp library

#### assignmentWorker
- Trigger: SQS queue (polls every 30s)
- Action: Read event, write activity log to DynamoDB, publish CloudWatch metric
- Runtime: Node.js

#### dailyDigest
- Trigger: EventBridge schedule (9 AM daily)
- Action: Scan Tasks table for due-today items, publish email to SNS
- Runtime: Node.js

## Coding Standards

### File Organization
- **Backend**: Controllers handle HTTP logic only; business logic → Services
- **Frontend**: Components are dumb; smart components use hooks + context for state
- **No deeply nested folders** — keep them 2-3 levels max for quick navigation

### Naming
- Database attributes: `camelCase`
- API routes: `/api/v1/teams/{teamId}/tasks` (nested resources)
- Environment variables: `SCREAMING_SNAKE_CASE`

### API Responses
```json
{
  "success": true,
  "data": {...},
  "message": "Task created"
}
```
Error responses:
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "User does not belong to this team"
}
```

### Error Handling
- **400**: Bad request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (team mismatch)
- **404**: Not found
- **500**: Server error (log to CloudWatch)

## Team Collaboration Rules

1. **Use Git feature branches**: `feature/kanban-board`, `feature/task-api`, `feature/cognito-auth`
2. **PR reviews required** — at least 1 approval before merge
3. **Commit messages**: `feat(frontend): add kanban drag-drop` or `fix(backend): team isolation check`
4. **Daily standup**: 15 min sync on blockers
5. **Task tracking**: Use GitHub Issues or separate tracking doc

## Deployment Checklist

- [ ] Frontend builds without errors (`npm run build`)
- [ ] Backend passes linting
- [ ] All env vars set in AWS EC2
- [ ] DynamoDB tables created with GSIs
- [ ] S3 buckets created (originals + resized)
- [ ] Lambda functions deployed and tested
- [ ] SNS topic + SQS queue set up
- [ ] EventBridge rule created
- [ ] Cognito user pool + app client created
- [ ] EC2 Auto Scaling Group + ALB configured
- [ ] CloudFront distribution created
- [ ] CloudWatch dashboard + alarms set up
- [ ] Architecture diagram completed
- [ ] Demo video recorded
- [ ] Submission form filled

## Known Constraints

- **Time:** < 48 hours — focus on MVP, not polish
- **Budget:** AWS Free Tier — stop instances when not testing
- **Team size:** 5 people — clear task division is critical
- **Spec scope:** All required features must be implemented; no shortcuts on team isolation or event-driven architecture

## Priority Order (if time runs short)

1. ✅ Cognito auth + role validation (gates everything)
2. ✅ Task CRUD with team isolation (core feature)
3. ✅ DynamoDB models (persistent data)
4. ✅ SNS/SQS notification on assignment
5. ✅ Comments on tasks
6. ✅ Kanban UI
7. ✅ Image upload + S3
8. ✅ Lambda image resize
9. ✅ EventBridge daily digest
10. ✅ CloudWatch dashboard
11. ✅ EC2 + ALB deployment
12. ✅ CloudFront CDN
13. ✅ Polish UI/UX

## Communication & Escalation

- **Blocker?** Post in team channel immediately — don't wait
- **AWS error?** Check CloudWatch logs first; CloudTrail for IAM issues
- **Not sure about design?** Ask before coding — saves rework

## Success Criteria

- All 5 team members can log in with different roles/teams
- Tasks are properly isolated by team (employee can't see other team's tasks)
- Image upload works
- Daily digest email sends
- CloudWatch dashboard shows metrics
- App is deployed and accessible via CloudFront URL
- Demo video demonstrates all features
- Code is clean and well-structured for handoff

---

**Last Updated:** 2026-05-20  
**Next Review:** Daily during dev sprint
