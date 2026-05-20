# Architecture Overview

## High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                          CloudFront CDN                          │
│                   (Global edge locations)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Application Load Balancer (ALB)                     │
│            (Cross-AZ health checks & routing)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴──────────────┐
                ↓                            ↓
        ┌──────────────────┐       ┌──────────────────┐
        │  EC2 Instance    │       │  EC2 Instance    │
        │  (Availability   │       │  (Availability   │
        │   Zone 1)        │       │   Zone 2)        │
        │ Node.js Backend  │       │ Node.js Backend  │
        └──────────────────┘       └──────────────────┘
                │                            │
                └─────────────┬──────────────┘
                              ↓
        ┌─────────────────────────────────────────────┐
        │  DynamoDB (Global Tables, Multi-AZ)         │
        │  - Users                                    │
        │  - Teams                                    │
        │  - Projects                                 │
        │  - Tasks (GSI: teamId, assigneeId)         │
        │  - Comments                                 │
        │  - ActivityLog                              │
        └─────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼──────────────────────┐
        ↓                     ↓                      ↓
    ┌────────┐          ┌─────────┐          ┌──────────┐
    │   S3   │          │   SNS   │          │   SQS    │
    │Images  │          │Topics   │          │Queue     │
    │(orig)  │          │(notify) │          │(async)   │
    └────────┘          └─────────┘          └──────────┘
        │                    │                      │
        ↓                    ↓                      ↓
    ┌────────┐          ┌─────────┐          ┌──────────┐
    │ Lambda │          │ Email   │          │ Lambda   │
    │ Resize │          │(SNS sub)│          │Worker    │
    └────────┘          └─────────┘          └──────────┘
                                                  │
                                                  ↓
                                         ┌──────────────┐
                                         │CloudWatch    │
                                         │Metrics/Logs  │
                                         └──────────────┘
```

## Components & Responsibilities

### Frontend (React)
- **Kanban board** with drag-and-drop task cards
- **Task detail modal** with comments and file upload
- **User authentication** via AWS Cognito
- **Team/role-based UI** (show/hide features based on role)
- **Real-time updates** via React Query polling

### Backend (Express.js)
- **REST API** with role-based access control
- **Token validation** on every request (JWT from Cognito)
- **Team isolation** enforced server-side (not UI-level)
- **S3 signed URLs** for file upload/download
- **SNS/SQS integration** for event-driven notifications

### AWS Services

| Service | Purpose | Criticality |
|---------|---------|-------------|
| **EC2 + Auto Scaling** | Hosts Node.js backend | CRITICAL |
| **ALB** | Distributes traffic across EC2s | CRITICAL |
| **CloudFront** | CDN for frontend + API caching | CRITICAL |
| **DynamoDB** | Persistent data storage | CRITICAL |
| **S3** | Image storage (2 buckets) | HIGH |
| **Lambda** | Serverless event processing | HIGH |
| **SNS** | Task assignment notifications | HIGH |
| **SQS** | Async task assignment queue | HIGH |
| **EventBridge** | Scheduled daily digest trigger | MEDIUM |
| **Cognito** | User authentication + roles | CRITICAL |
| **CloudWatch** | Monitoring, dashboards, alarms | HIGH |
| **IAM** | Least-privilege role management | CRITICAL |

## Data Flow

### Task Creation
```
Manager creates task in frontend
         ↓
POST /api/v1/tasks (with auth token)
         ↓
Backend validates token + role
         ↓
Insert task into DynamoDB.Tasks
         ↓
Return task to frontend
         ↓
Frontend updates Kanban board
```

### Task Assignment
```
Manager assigns task to employee
         ↓
PUT /api/v1/tasks/{taskId}/assign
         ↓
Backend validates token + checks if assignee's team matches
         ↓
Update task.assigneeId in DynamoDB
         ↓
Publish event to SNS topic
         ↓
SNS fans out:
  ├─ Email subscription → assignee receives email notification
  └─ SQS queue → worker Lambda consumes
         ↓
Worker Lambda:
  ├─ Writes activity log to DynamoDB
  └─ Publishes CloudWatch metric (TasksAssignedPerTeam)
```

### Image Upload
```
Employee uploads image in task modal
         ↓
Frontend calls POST /api/v1/tasks/{taskId}/images
         ↓
Backend generates S3 presigned URL
         ↓
Frontend uploads directly to S3 (client-side)
         ↓
S3 PUT triggers Lambda.imageResize
         ↓
Lambda resizes image → writes to resized bucket
         ↓
Backend updates task.imageUrl in DynamoDB
```

### Daily Digest
```
EventBridge fires at 9:00 AM daily
         ↓
Triggers Lambda.dailyDigest
         ↓
Lambda scans DynamoDB.Tasks for tasks due today
         ↓
For each task, publish email to SNS
         ↓
SNS subscription forwards email to assignee
```

## Deployment Architecture

### Availability Zones
- **EC2 instances** span at least 2 AZs (us-east-1a, us-east-1b)
- **ALB** spans both AZs with health checks
- **DynamoDB** replicates across AZs automatically
- **RTO/RPO**: < 5 minutes (ALB failover + ASG replace)

### Load Balancing
- **ALB** routes traffic to EC2 instances
- **Health check**: GET /health → returns 200 if backend is up
- **Stickiness**: Disabled (stateless backend)
- **CloudFront** caches frontend assets (index.html, JS bundles, CSS)

### Disaster Recovery
- **Auto Scaling Group** automatically spins up new EC2 if one fails
- **Database**: DynamoDB is managed by AWS (auto-replicated)
- **S3**: Versioning enabled (old images retained on update)
- **Backup strategy**: Use DynamoDB Point-in-Time Recovery

## Security

### Authentication & Authorization
- **Cognito** issues JWT tokens (with `role` and `teamId` claims)
- **Backend** validates JWT signature on every request
- **Express middleware** extracts user from token and attaches to request
- **Route handlers** check role (manager vs. employee) and team membership

### Network Security
- **VPC** with public subnets (ALB) and private subnets (EC2)
- **NAT Gateway** for EC2 outbound traffic
- **Security Groups** restrict traffic:
  - ALB: Allow 80 (HTTP), 443 (HTTPS) from internet
  - EC2: Allow 5000 from ALB only
  - RDS/DynamoDB: Allow from EC2 only (no internet exposure)

### Data Security
- **S3** buckets: Private by default, presigned URLs for access
- **DynamoDB** encryption at rest (managed by AWS)
- **Secrets** stored in `.env` (not in code)
- **IAM roles** grant minimal permissions (no full AWS access)

## Monitoring & Observability

### CloudWatch Dashboards
- **Tasks created per day** (metric: TasksCreatedDaily)
- **Tasks closed per day per team** (metric: TasksClosedByTeam)
- **Average time-to-close** (metric: AvgTimeToClose)
- **EC2 CPU utilization** (auto-collected)

### CloudWatch Alarms
- **Overdue tasks** > threshold → triggers SNS notification
- **EC2 CPU** > 80% for 5 min → scales up
- **ALB unhealthy targets** > 0 → triggers alert

### Logging
- **Backend logs** → CloudWatch Logs
- **Lambda logs** → CloudWatch Logs
- **Access logs** → ALB logs to S3

## Scaling Strategy

### Horizontal Scaling
- **EC2 Auto Scaling Group**: Target 70% CPU, scale from 2–10 instances
- **DynamoDB**: On-demand billing (no provisioning needed)
- **Lambda**: Automatically scales (max concurrency limited by AWS)

### Vertical Scaling
- **EC2 instance type**: Start with t3.medium (free tier); upgrade if needed
- **DynamoDB**: Remains same (on-demand is elastic)

## Cost Optimization

### Free Tier Awareness
- **EC2**: 750 hours/month total; 2 instances = 360 hrs — within limit if stopped daily
- **EBS**: 30 GB total; 20 GB per instance = 40 GB — **over limit**; use smaller instances
- **ALB**: 750 hours/month; 1 ALB = 750 hrs — at limit if always on
- **DynamoDB**: 25 GB storage free; 1M read units free; on-demand is less predictable
- **Lambda**: 1M requests free; 400K GB-seconds free

### Cost-Saving Tactics
1. **Stop instances when not developing** (keep ALB running only for demos)
2. **Use t3.micro** for EC2 (if available in free tier)
3. **DynamoDB on-demand** — no provisioning cost
4. **S3**: Free tier covers 5 GB; monitor image sizes
5. **CloudFront**: 1 TB free per month (test locally first)

---

## Diagram Tools

To create the AWS architecture diagram for submission:
1. **Lucidchart** (recommended; has AWS shape library)
2. **Draw.io** (free; AWS shape pack available)
3. **PowerPoint + AWS icons** (https://aws.amazon.com/architecture/icons/)
4. **Miro** or **Figma** (if team prefers)

Save as **docs/ARCHITECTURE_DIAGRAM.png** and link in README.md.
