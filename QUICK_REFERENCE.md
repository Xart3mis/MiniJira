# Mini-Jira Quick Reference Card

**⏰ Deadline:** May 22, 2026 at 11:59 PM  
**📊 Status:** Project structure set up + task breakdown ready  
**🚀 Tech:** React + Express + DynamoDB + Lambda + EC2/ALB/CloudFront

---

## Getting Started (5 min)

```bash
# Install all dependencies
npm run install-all

# Start local dev (frontend + backend)
npm run dev

# Access
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

---

## Team Roles & Tasks

| Person | Focus | Key Deliverable |
|--------|-------|-----------------|
| **Person 1** | Frontend Core | Login page + Dashboard layout |
| **Person 2** | Frontend Features | Kanban board + Task modal |
| **Person 3** | Backend API | Express routes + Auth |
| **Person 4** | Backend Services | S3 upload + SNS/Lambda |
| **You** | DevOps | EC2 + ALB + CloudFront + Deployment |

👉 See **TEAM_TASKS.md** for detailed task breakdown

---

## Critical Requirements

### 1. Team Isolation (Server-Side!)
```javascript
// ❌ WRONG: Hide in UI only
const tasks = allTasks.filter(t => t.teamId === userTeamId)

// ✅ RIGHT: Enforce in backend
GET /tasks → query DynamoDB GSI(teamId) where teamId = req.user.teamId
```

### 2. Authentication
- User signs up/in via Cognito
- Backend validates JWT on every request
- Extract `role` + `teamId` from token claims

### 3. Demo Scenario (MUST WORK)
```
Manager Ali:
  - Create Task A (Frontend team, assign → Sara)
  - Create Task B (Backend team, assign → Omar)

Employee Sara:
  - Logs in → sees ONLY Task A

Employee Omar:
  - Logs in → sees ONLY Task B

Manager Ali:
  - Logs in → sees both tasks + can filter by team
```

---

## Key Routes

### Backend API Pattern
```
POST   /api/v1/tasks                    Create task (manager only)
GET    /api/v1/tasks                    List tasks (team-scoped)
GET    /api/v1/tasks/:taskId            Get task
PUT    /api/v1/tasks/:taskId            Update task
DELETE /api/v1/tasks/:taskId            Delete task (manager only)

POST   /api/v1/tasks/:taskId/comments   Add comment
GET    /api/v1/tasks/:taskId/comments   List comments

POST   /api/v1/tasks/:taskId/images     Get S3 presigned URL
DELETE /api/v1/tasks/:taskId/images/:key Delete image

GET    /health                          Health check (no auth)
```

See **docs/API.md** for full spec.

---

## DynamoDB Tables Checklist

- [ ] Users (PK: userId)
- [ ] Teams (PK: teamId)
- [ ] Projects (PK: projectId, GSI: teamId)
- [ ] Tasks (PK: taskId, GSI1: teamId, GSI2: assigneeId) **← Most important**
- [ ] Comments (PK: taskId, SK: commentId)
- [ ] ActivityLog (PK: taskId, SK: timestamp)

All tables: **Use ON-DEMAND billing** (free tier friendly)

---

## Environment Variables

Copy `.env.example` → `.env` and fill in:

```
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXX
COGNITO_CLIENT_ID=your_client_id
DYNAMODB_TASKS_TABLE=minijira-tasks
S3_BUCKET_ORIGINALS=minijira-images-originals
SNS_TOPIC_TASK_ASSIGNMENT=arn:aws:sns:...
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...
```

---

## AWS Free Tier Limits

⚠️ **CRITICAL: Stop (don't terminate) resources when not using!**

| Service | Monthly Limit | Cost if Over |
|---------|---------------|--------------|
| EC2 | 750 hours | $0.0116/hr |
| EBS | 30 GB | $0.10/GB |
| ALB | 750 hours | $0.0225/hr |
| DynamoDB | 25 GB | Pay per request |
| Lambda | 1M requests | $0.20 per 1M |
| S3 | 5 GB | $0.023/GB |
| CloudFront | 1 TB/month | Free tier covers it |

**Math:** 2 EC2 instances × 24 hrs × 30 days = 1,440 hrs (⚠️ over 750 limit)  
→ **Turn off instances when not developing!**

---

## Daily Standup Template

Each person: 2–3 minutes

1. **What did I complete?** (specific file/route/component)
2. **What am I working on?** (next immediate task)
3. **Any blockers?** (waiting for Person X to finish Y?)

**Example:**
- "Finished Cognito login page. Starting dashboard layout. Blocked on Person 4 for S3 URL API."

---

## Code Style Quick Rules

- **Semicolons:** Required
- **Indentation:** 2 spaces
- **Variable names:** camelCase
- **File names:** lowercase-kebab-case (frontend components: PascalCase)
- **Comments:** Only for non-obvious why; describe logic implicitly with good names

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/kanban-board

# Commit with type
git commit -m "feat(frontend): add kanban drag-and-drop"

# Push & create PR
git push origin feature/kanban-board
# → Create PR on GitHub, request review, wait for approval, merge
```

---

## Testing Your Work

### Frontend
- [ ] Run `npm --prefix frontend run dev`
- [ ] Click through features in browser (http://localhost:5173)
- [ ] Check browser console for errors

### Backend
- [ ] Run `npm --prefix backend run dev`
- [ ] Test endpoints with Postman or `curl`:
  ```bash
  curl -H "Authorization: Bearer <token>" http://localhost:5000/api/v1/tasks
  ```
- [ ] Check CloudWatch logs for errors

### Full Stack
- [ ] Frontend calls backend API (not mocked)
- [ ] Data persists in DynamoDB
- [ ] No console.log spam
- [ ] Error handling works (bad tokens, missing fields, etc.)

---

## AWS Deployment Commands (You)

```bash
# Launch 2 EC2 instances across AZs
# Create ALB + target group
# Create ASG (min 2, max 10, scale on CPU)
# Create CloudFront distribution
# Create CloudWatch dashboard + alarms

# Test live
# Visit CloudFront URL → should see live app
```

See **docs/SETUP.md** for step-by-step.

---

## Architecture Diagram Must Include

- CloudFront (CDN)
- ALB (load balancer)
- EC2 instances (2 AZs)
- DynamoDB (multi-AZ)
- S3 buckets (2)
- Lambda functions (3)
- SNS/SQS (messaging)
- EventBridge (scheduler)
- Cognito (auth)
- CloudWatch (monitoring)

Use AWS icons from: https://aws.amazon.com/architecture/icons/

---

## Deliverables Checklist

- [ ] GitHub repo link
- [ ] README with architecture diagram
- [ ] Live CloudFront URL (working app)
- [ ] Demo video (< 5 min, shows all features)
- [ ] Submission form filled
- [ ] **AWS resources STOPPED** (not terminated!)

---

## Red Flags 🚨

| Issue | Fix |
|-------|-----|
| Employee can see another team's task | Check team isolation in GET /tasks middleware |
| Image upload fails | Check S3 bucket CORS + presigned URL expiration |
| Token validation fails | Verify JWT public key caching + Cognito issuer URL |
| Lambda not triggering | Check S3 event notification config + Lambda IAM permissions |
| EC2 health checks failing | Check security groups allow 5000 from ALB |
| CloudWatch has no data | Check IAM role allows PutMetricData + check code is publishing metrics |

---

## Contact & Escalation

- **Blocker?** Post in team Slack/Discord immediately
- **AWS error?** Check CloudWatch Logs first, then CloudTrail
- **Code review feedback?** Be respectful, explain why, approve when ready
- **Deadline stress?** Focus on MVP features (see TEAM_TASKS.md priority list)

---

## Last-Minute Tips

1. **Test demo scenario** multiple times before final submission
2. **Keep CloudWatch dashboard open** during testing (spot issues early)
3. **Stop (don't terminate) EC2** after each dev session
4. **Commit frequently** (don't lose work to merge conflicts)
5. **Document as you go** (README + API docs save time at the end)
6. **Record demo video early** (easier to re-record than panic last minute)

---

## Let's Build! 🚀

Good luck! This is ambitious but doable. Clear task division + daily standups = success.

Questions? Check:
1. **CLAUDE.md** — Coding standards + architecture decisions
2. **docs/SETUP.md** — Detailed AWS deployment
3. **TEAM_TASKS.md** — Task breakdown
4. **Slack/Discord** — Ask team immediately
